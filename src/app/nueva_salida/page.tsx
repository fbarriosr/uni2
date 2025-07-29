
'use client';

import { useState, useActionState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Loader2, Car, Bus, Footprints, Wand2, Sun, Dog, Paintbrush, Bike, Landmark, Gamepad2, UtensilsCrossed, Music, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import DualMonthCalendar from '@/components/DualMonthCalendar';
import TransportModeSelector from '@/components/nueva_salida/TransportModeSelector';
import ActivityPreferenceFilters from '@/components/nueva_salida/ActivityPreferenceFilters';
import ParticipantSelector from '@/components/nueva_salida/ParticipantGroupSelector'; // Renamed in my head, but path is the same
import type { DateRange } from 'react-day-picker';
import { saveSalidaPreferences, type SaveSalidaState } from '@/lib/actions/salidaActions';
import { useToast } from "@/hooks/use-toast";
import { parseISO, startOfWeek, addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getUserById, getUsersByIds, getActivityById } from '@/lib/data';
import type { User, Activity } from '@/lib/types';
import type { ImageHighlight } from '@/components/CalendarDisplay';


const AiSummaryBox = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg shadow-sm">
    <h3 className="flex items-center text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
      <Wand2 className="h-4 w-4 mr-2" />
      {title}
    </h3>
    <div className="text-sm text-gray-700 dark:text-gray-300/90 space-y-2">
      {children}
    </div>
  </div>
);

interface BirthdayInfo {
  date: Date;
  name: string;
}

function NuevaSalidaPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [currentDisplayMonth, setCurrentDisplayMonth] = useState(new Date());
  const [clientReady, setClientReady] = useState(false);
  const [today, setToday] = useState<Date | undefined>();
  const [upcomingOutingDates, setUpcomingOutingDates] = useState<Date[]>([]);
  const [familyBirthdays, setFamilyBirthdays] = useState<BirthdayInfo[]>([]);
  const [imageHighlightData, setImageHighlightData] = useState<ImageHighlight[]>([]);
  
  // State for controlled components
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]); // Changed from groupId
  const [selectedTransport, setSelectedTransport] = useState<string>('auto');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [otherPreference, setOtherPreference] = useState('');
  
  const { toast } = useToast();
  
  const initialState: SaveSalidaState = { message: '', success: false };
  const [state, formAction, isPending] = useActionState(saveSalidaPreferences, initialState);

  // Effect to initialize form from URL search params
  useEffect(() => {
    const participantIds = searchParams.get('participantIds'); // Changed from groupId
    let dateFrom = searchParams.get('dateFrom');
    let dateTo = searchParams.get('dateTo');
    const transportMode = searchParams.get('transportMode');
    const filters = searchParams.get('filters');
    const otherPref = searchParams.get('otherPreference');
    const dateExpression = searchParams.get('dateExpression');

    if (participantIds) setSelectedParticipantIds(participantIds.split(',')); // Changed
    if (transportMode) setSelectedTransport(transportMode);
    if (filters) setSelectedFilters(filters.split(','));
    if (otherPref) setOtherPreference(otherPref);
    
    // Handle dateExpression from AI as a fallback if dateFrom is not already processed by the tool
    if (dateExpression && !dateFrom) {
      const now = new Date();
      if (dateExpression.toLowerCase().includes('this weekend') || dateExpression.toLowerCase().includes('fin de semana')) {
          const start = startOfWeek(now, { weekStartsOn: 1 }); // Monday
          const saturday = addDays(start, 5);
          const sunday = addDays(start, 6);
          // Use ISO string part to avoid timezone issues and match what the tool would do
          dateFrom = saturday.toISOString().split('T')[0];
          dateTo = sunday.toISOString().split('T')[0];
      }
      // Add more expressions here if needed
    }

    if (dateFrom) {
        const from = parseISO(dateFrom);
        const to = dateTo ? parseISO(dateTo) : undefined;
        setSelectedRange({ from, to });
        setCurrentDisplayMonth(from); // Center calendar on the selected date
    }
  }, [searchParams]);

  useEffect(() => {
    setClientReady(true);
    const clientToday = new Date();
    clientToday.setHours(0, 0, 0, 0); // Normalize to start of day
    setToday(clientToday);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
            const userDoc = await getUserById(user.uid);
            const familyHeadUid = userDoc?.role === 'hijo' && userDoc.parentUid ? userDoc.parentUid : user.uid;

            if (!familyHeadUid) {
                toast({ title: "Error", description: "No se pudo determinar el grupo familiar.", variant: "destructive" });
                setAuthLoading(false);
                return;
            }

            const outingsRef = collection(db, 'users', familyHeadUid, 'salidas');
            const q = query(outingsRef, where('dateRange.from', '>=', clientToday));
            const querySnapshot = await getDocs(q);

            const upcomingDates: Date[] = [];
            const highlights: ImageHighlight[] = [];

            for (const docSnap of querySnapshot.docs) {
                const data = docSnap.data();
                const fromDate = (data.dateRange.from as Timestamp).toDate();
                upcomingDates.push(fromDate);

                const activitiesRequestRef = collection(db, 'users', familyHeadUid, 'salidas', docSnap.id, 'actividades');
                const requestQuery = query(activitiesRequestRef);
                const requestSnapshot = await getDocs(requestQuery);
                
                if (!requestSnapshot.empty) {
                    const firstActivityId = requestSnapshot.docs[0].id;
                    const activityData = await getActivityById(firstActivityId);
                    if (activityData?.mainImage) {
                         highlights.push({
                            date: format(fromDate, "dd MMM yyyy", { locale: es }),
                            imageUrl: activityData.mainImage,
                            aiHint: 'upcoming outing',
                         });
                    }
                }
            }
            setUpcomingOutingDates(upcomingDates);
            setImageHighlightData(highlights);

            // --- Fetch Family Birthdays ---
            const fetchedUser = await getUserById(user.uid);
            if (fetchedUser) {
              const parentUser = await getUserById(familyHeadUid);
              const allMemberIds: string[] = [];
              if (parentUser) {
                allMemberIds.push(parentUser.id);
                if (parentUser.familyMembers) {
                  allMemberIds.push(...parentUser.familyMembers);
                }
              } else {
                allMemberIds.push(fetchedUser.id);
              }
              const uniqueMemberIds = Array.from(new Set(allMemberIds));
              if (uniqueMemberIds.length > 0) {
                const allFamilyMembers = await getUsersByIds(uniqueMemberIds);
                const birthdayInfoList: BirthdayInfo[] = [];
                const currentYear = new Date().getFullYear();
                allFamilyMembers.forEach(member => {
                  if (member.birthday && member.name) {
                    const birthDate = new Date(member.birthday);
                    const month = birthDate.getMonth();
                    const day = birthDate.getDate();
                    birthdayInfoList.push({ date: new Date(currentYear, month, day), name: member.name });
                    birthdayInfoList.push({ date: new Date(currentYear + 1, month, day), name: member.name });
                  }
                });
                setFamilyBirthdays(birthdayInfoList);
              }
            }
            // --- End Fetch Family Birthdays ---
        } catch (error) {
            console.error("Error fetching page data:", error);
            toast({
                title: "Error de Carga",
                description: "No se pudieron cargar tus datos existentes en el calendario.",
                variant: "destructive"
            });
        }
      } else {
        router.push('/login');
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [router, toast]);
  
  useEffect(() => {
    if (state.message && !state.success) {
      toast({
        title: "Error",
        description: state.message,
        variant: 'destructive',
      });
    }
  }, [state, toast]);

  const handleFilterChange = (id: string, checked: boolean) => {
    setSelectedFilters(prev => 
      checked ? [...prev, id] : prev.filter(f => f !== id)
    );
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const transportOptions = [
    { id: 'caminando', label: 'Caminando', icon: <Footprints size={16} /> },
    { id: 'transportePublico', label: 'Transporte Público', icon: <Bus size={16} /> },
    { id: 'auto', label: 'Auto', icon: <Car size={16} /> }
  ];

  const filterOptions = [
    { id: 'aireLibre', label: 'Aire Libre', icon: <Sun size={16} /> },
    { id: 'animales', label: 'Animales', icon: <Dog size={16} /> },
    { id: 'creatividad', label: 'Creatividad', icon: <Paintbrush size={16} /> },
    { id: 'deportes', label: 'Deportes', icon: <Bike size={16} /> },
    { id: 'cultural', label: 'Cultural', icon: <Landmark size={16} /> },
    { id: 'juegos', label: 'Juegos', icon: <Gamepad2 size={16} /> },
    { id: 'comida', label: 'Comida', icon: <UtensilsCrossed size={16} /> },
    { id: 'musica', label: 'Música', icon: <Music size={16} /> },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <header className="mb-8">
        <div>
          <h1 className="text-3xl font-headline text-foreground">Planear una Nueva Salida</h1>
          <p className="text-muted-foreground mt-1">Organiza el panorama perfecto para tu familia.</p>
        </div>
      </header>

      <form action={formAction}>
        {currentUser && <input type="hidden" name="userId" value={currentUser.uid} />}
        <input type="hidden" name="selectedParticipantIds" value={selectedParticipantIds.join(',')} />
        {selectedRange?.from && <input type="hidden" name="dateFrom" value={selectedRange.from.toISOString()} />}
        {selectedRange?.to && <input type="hidden" name="dateTo" value={selectedRange.to.toISOString()} />}
        <input type="hidden" name="transportMode" value={selectedTransport} />
        <input type="hidden" name="filters" value={selectedFilters.join(',')} />
        <input type="hidden" name="otherPreference" value={otherPreference} />


        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-headline text-primary mb-4">¿Quiénes van?</h2>
            <ParticipantSelector 
              selectedParticipantIds={selectedParticipantIds}
              onSelectedParticipantIdsChange={setSelectedParticipantIds}
            />
            <AiSummaryBox title="Visión general creada por IA">
              <p>Seleccionar los participantes ayuda a la IA a encontrar actividades adecuadas para el grupo. Por ejemplo, si se incluyen niños pequeños, se priorizarán panoramas con acceso universal y zonas de juego.</p>
            </AiSummaryBox>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-headline text-primary mb-4">¿Cuándo van?</h2>
            {clientReady && today ? (
              <DualMonthCalendar
                mode="range"
                selected={selectedRange}
                onSelect={setSelectedRange}
                month={currentDisplayMonth}
                onMonthChange={setCurrentDisplayMonth}
                todayDate={today}
                disabled={{ before: today }}
                birthdayInfo={familyBirthdays}
                upcomingDates={upcomingOutingDates}
                imageHighlightData={imageHighlightData}
              />
            ) : (
              <div className="bg-card p-4 rounded-xl shadow-lg border">
                <Skeleton className="h-[550px] w-full" />
              </div>
            )}
            <AiSummaryBox title="Visión general creada por IA">
              <p>Elegir un rango de fechas permite filtrar actividades según la temporada y eventos especiales. Si seleccionas un fin de semana de verano, se sugerirán más opciones al aire libre y acuáticas.</p>
            </AiSummaryBox>
          </section>

          <Separator />

          <section>
            <TransportModeSelector 
              transportOptions={transportOptions}
              value={selectedTransport}
              onValueChange={setSelectedTransport}
            />
            <AiSummaryBox title="Visión general creada por IA">
              <p>El modo de transporte influye en la distancia y accesibilidad de las sugerencias. Al elegir "Auto", se incluyen panoramas fuera de la ciudad, mientras que "Transporte Público" prioriza lugares cercanos a estaciones de metro o paraderos.</p>
            </AiSummaryBox>
          </section>

          <Separator />

          <section>
            <ActivityPreferenceFilters 
              filterOptions={filterOptions}
              selectedFilters={selectedFilters}
              onFilterChange={handleFilterChange}
              otherValue={otherPreference}
              onOtherValueChange={setOtherPreference}
            />
            <AiSummaryBox title="Visión general creada por IA">
              <p>Las preferencias de actividades son clave para personalizar la experiencia. Si marcas "Aire Libre" y mencionas "astronomía" como otra preferencia, la IA buscará observatorios o eventos de estrellas en lugares abiertos.</p>
            </AiSummaryBox>
          </section>
          
          <Separator />

          <div className="flex justify-end pt-4">
            <Button size="lg" type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              <Save className="mr-2 h-5 w-5" />
              Guardar Preferencias y Buscar Actividades
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function NuevaSalidaPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <NuevaSalidaPageContent />
    </Suspense>
  );
}
