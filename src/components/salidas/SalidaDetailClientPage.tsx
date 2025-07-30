
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, Timestamp, collection, getDocs, query, orderBy, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

import type { Activity, User, Address } from '@/lib/types';
import { getUsersByIds, getActivityById, getUserById } from '@/lib/data';
import { updateSalidaParticipants } from '@/lib/actions/salidaActions';

import { Loader2, Users, AlertCircle, Calendar, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SuggestionCategorySection from '@/components/home/SuggestionCategorySection';
import FeaturedSuggestionSection from '@/components/home/FeaturedSuggestionSection';
import HomeRecuerdosSection from '@/components/home/HomeRecuerdosSection';
import SalidaPageHeader from './SalidaPageHeader'; // Import the new header
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import ParticipantSelector from '@/components/nueva_salida/ParticipantGroupSelector';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import MapDisplayLoader from '@/components/MapDisplayLoader';
import { Input } from '@/components/ui/input';



interface SalidaDetailClientPageProps {
  salidaId: string;
  initialActivities: Activity[];
}

interface SalidaData {
  id: string;
  dateRange: {
    from: Date;
    to: Date | null;
  };
  participantIds: string[];
}

// Interfaces for processing memories
interface SalidaPlan {
  id: string;
  dateRange: { from: Date; to: Date | null };
  createdAt: Date;
  participantIds: string[];
  activity?: Activity | null;
  participantAvatarUrls?: string[];
}

interface OutingDisplayItem {
  id: string;
  title: string;
  date: string;
  imageUrl: string;
  aiHint?: string;
  activityId?: string;
  salidaId?: string;
  participantAvatarUrls?: string[];
}


export default function SalidaDetailClientPage({ salidaId, initialActivities }: SalidaDetailClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const [salidaData, setSalidaData] = useState<SalidaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [activeUserAddress, setActiveUserAddress] = useState<Address | null>(null);

  const [myActivities, setMyActivities] = useState<Activity[]>([]);
  
  const [participants, setParticipants] = useState<User[]>([]);
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);
  const [isSavingParticipants, setIsSavingParticipants] = useState(false);
  
  const [recuerdos, setRecuerdos] = useState<OutingDisplayItem[]>([]);

  const [searchTerm, setSearchTerm] = useState('');

  const fetchPageData = useCallback(async (uid: string) => {
    setLoading(true);
    try {
        const loggedInUser = await getUserById(uid);
        if (!loggedInUser) {
            setLoading(false);
            toast({ title: "Error", description: "No se pudo cargar la información del usuario.", variant: "destructive" });
            return;
        }
        
        if (loggedInUser.addresses && loggedInUser.activeAddressId) {
            const activeAddr = loggedInUser.addresses.find(a => a.id === loggedInUser.activeAddressId);
            setActiveUserAddress(activeAddr || null);
        }

        const familyHeadUid = loggedInUser.role === 'hijo' && loggedInUser.parentUid ? loggedInUser.parentUid : uid;

        if (!familyHeadUid) {
            setLoading(false);
            toast({ title: "Error", description: "No se encontró el grupo familiar.", variant: "destructive" });
            return;
        }

        const salidaDocRef = doc(db, 'users', familyHeadUid, 'salidas', salidaId);
        const allSalidasQuery = query(collection(db, 'users', familyHeadUid, 'salidas'), orderBy('createdAt', 'desc'));

      const [salidaSnap, allSalidasSnap] = await Promise.all([
          getDoc(salidaDocRef),
          getDocs(allSalidasQuery)
      ]);

      if (salidaSnap.exists()) {
        const data = salidaSnap.data();
        const participantIds = data.participantIds || [];

        setSalidaData({
          id: salidaSnap.id,
          dateRange: {
            from: (data.dateRange.from as Timestamp).toDate(),
            to: data.dateRange.to ? (data.dateRange.to as Timestamp).toDate() : null,
          },
          participantIds,
        });
        setTempSelectedIds(participantIds);

        if (participantIds.length > 0) {
          const participantUsers = await getUsersByIds(participantIds);
          setParticipants(participantUsers);
        } else {
          setParticipants([]);
        }

        const requestedActivitiesRef = collection(db, 'users', familyHeadUid, 'salidas', salidaId, 'actividades');
        const requestedActivitiesSnap = await getDocs(requestedActivitiesRef);
        const requestedActivityIds = requestedActivitiesSnap.docs.map(doc => doc.id);
        
        const myActivitiesData = initialActivities.filter(act => requestedActivityIds.includes(act.id));
        setMyActivities(myActivitiesData);
      } else {
        setSalidaData(null);
      }

      // --- Process ALL outings for memories section ---
      const clientNow = new Date();
      const familyMembersMap = new Map<string, User>();
      const parentUser = await getUserById(familyHeadUid);
      if (parentUser) {
          const allMemberIds = [parentUser.id, ...(parentUser.familyMembers || [])];
          const uniqueMemberIds = Array.from(new Set(allMemberIds));
          if (uniqueMemberIds.length > 0) {
              const allFamilyMembers = await getUsersByIds(uniqueMemberIds);
              allFamilyMembers.forEach(member => familyMembersMap.set(member.id, member));
          }
      }

      const allPlans: SalidaPlan[] = await Promise.all(
        allSalidasSnap.docs.map(async (docSnap) => {
            const data = docSnap.data();
            let fetchedActivity: Activity | null = null;
            const activitiesRequestRef = collection(db, 'users', familyHeadUid, 'salidas', docSnap.id, 'actividades');
            const requestQuery = query(activitiesRequestRef, orderBy('requestedAt', 'desc'));
            const requestSnapshot = await getDocs(requestQuery);
            
            if (!requestSnapshot.empty) {
                const firstActivityId = requestSnapshot.docs[0].id;
                fetchedActivity = await getActivityById(firstActivityId) || null;
            }

            const participantIds = data.participantIds || [];
            const participantAvatarUrls = participantIds
                .map((id: string) => familyMembersMap.get(id)?.avatarUrl)
                .filter((url?: string): url is string => !!url);
            
            return {
                id: docSnap.id,
                dateRange: {
                    from: (data.dateRange.from as Timestamp).toDate(),
                    to: data.dateRange.to ? (data.dateRange.to as Timestamp).toDate() : null,
                },
                createdAt: (data.createdAt as Timestamp).toDate(),
                participantIds,
                activity: fetchedActivity,
                participantAvatarUrls,
            };
        })
      );
      
      const pastOutings = allPlans
        .filter(plan => plan.dateRange.from < clientNow && plan.id !== salidaId)
        .map(plan => {
            const imageUrl = plan.activity?.mainImage || 'https://placehold.co/600x800.png?text=Sin%0AActividad';
            const imageHint = plan.activity?.mainImage ? 'past activity photo' : 'past outing plan no activity';
            return {
                id: plan.id,
                title: `Recuerdo de ${format(plan.dateRange.from, "P", { locale: es })}`,
                date: format(plan.dateRange.from, "dd MMM yyyy", { locale: es }).toUpperCase(),
                imageUrl: imageUrl,
                aiHint: imageHint,
                salidaId: plan.id,
                activityId: plan.activity?.id,
                participantAvatarUrls: plan.participantAvatarUrls,
            };
        });
    
      setRecuerdos(pastOutings);

    } catch (error) {
      console.error("Error fetching page data:", error);
    } finally {
      setLoading(false);
    }
  }, [salidaId, initialActivities, toast]);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchPageData(currentUser.uid);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, [fetchPageData]);

  const handleSaveParticipants = async () => {
    if (!user) return;
    setIsSavingParticipants(true);
    const result = await updateSalidaParticipants(salidaId, user.uid, tempSelectedIds);
    if (result.success) {
        toast({ title: "Éxito", description: result.message });
        await fetchPageData(user.uid);
        setIsParticipantModalOpen(false);
    } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    setIsSavingParticipants(false);
  };

  const availableSuggestions = useMemo(() => {
    const myActivityIds = new Set(myActivities.map(a => a.id));
    return initialActivities.filter(act => !myActivityIds.has(act.id));
  }, [initialActivities, myActivities]);
  
  const activitiesForMap = useMemo(() => {
    return [...myActivities, ...availableSuggestions];
  }, [myActivities, availableSuggestions]);

  // Filter activities based on searchTerm
  const filterActivities = useCallback((activities: Activity[], term: string) => {
    if (!term) return activities;
    return activities.filter(activity =>
      activity.name.toLowerCase().includes(term.toLowerCase()) ||
      activity.description?.toLowerCase().includes(term.toLowerCase()) // Added description search
      // Add other fields if needed
    );
  }, []);

  const suggestions = useMemo(() => availableSuggestions.filter(act => act.category === "Ideas rápidas"), [availableSuggestions]);
  const soloParaUstedes = useMemo(() => availableSuggestions.filter(act => act.category === "Solo para ustedes"), [availableSuggestions]);
  const libreGratuito = useMemo(() => availableSuggestions.filter(act => act.category === "Libre y gratuito"), [availableSuggestions]);

  const filteredMyActivities = useMemo(() => filterActivities(myActivities, searchTerm), [myActivities, searchTerm, filterActivities]);
  const filteredSuggestions = useMemo(() => filterActivities(suggestions, searchTerm), [suggestions, searchTerm, filterActivities]);
  const filteredLibreGratuito = useMemo(() => filterActivities(libreGratuito, searchTerm), [libreGratuito, searchTerm, filterActivities]);
  const filteredSoloParaUstedes = useMemo(() => filterActivities(soloParaUstedes, searchTerm), [soloParaUstedes, searchTerm, filterActivities]);

 
  const formattedDateRange = useMemo(() => {
    if (!salidaData) return '';
    const { from, to } = salidaData.dateRange;
    if (to && format(from, 'yyyy-MM-dd') !== format(to, 'yyyy-MM-dd')) {
      return `Del ${format(from, 'd MMMM yyyy', { locale: es })} al ${format(to, 'd MMMM yyyy', { locale: es })}`;
    }
    return `Para el ${format(from, 'd MMMM yyyy', { locale: es })}`;
  }, [salidaData]);

  const currentJourneyStep = useMemo(() => {
    if (loading) return 1;
    if (myActivities.length > 0) return 2;
    return 1;
  }, [loading, myActivities]);

  // Keep filteredParticipants as it might still be useful in the modal
  const filteredParticipants = useMemo(() => {
    if (!searchTerm) return participants;
    return participants.filter(participant =>
      participant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [participants, searchTerm]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!salidaData) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold">Salida no encontrada</h1>
        <p className="text-muted-foreground">La salida que buscas no existe o no tienes permiso para verla.</p>
        <Button asChild className="mt-4"><Link href="/inicio">Volver a Inicio</Link></Button>
      </div>
    );
  }

  // Determine if any activity sections should be shown based on filters
  const showMyActivities = filteredMyActivities.length > 0 || !searchTerm;
  const showSuggestions = filteredSuggestions.length > 0 || !searchTerm;
  const showLibreGratuito = (filteredLibreGratuito.length > 0 || !searchTerm) && libreGratuito.length > 0; // Only show if original had items
  const showSoloParaUstedes = (filteredSoloParaUstedes.length > 0 || !searchTerm) && soloParaUstedes.length > 0; // Only show if original had items
  const showRecuerdos = recuerdos.length > 0 || !searchTerm;

  return (
    <>
      <div className="container mx-auto py-8 px-0 sm:px-4">
        <SalidaPageHeader
            title="Sugerencias de Actividades para tu Plan"
            subtitle={formattedDateRange}
            salidaId={salidaId}
            userId={user?.uid || null}
            currentStep={currentJourneyStep}
        />
        
        {/* Search Bar - Moved to activity section */}
        <div className="mt-8 px-4 flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar actividades en esta salida..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>

        {/* Participants section (not filtered by the main search for activities) */}
        <div className="mt-4 flex flex-col items-center justify-center gap-3">
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Participantes:</span>
                <div className="flex -space-x-2">
                    {participants.length > 0 ? participants.map(p => (
                        <TooltipProvider key={p.id}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                  <Avatar className="h-9 w-9 border-2 border-background">
                                      <AvatarImage src={p.avatarUrl} alt={p.name || 'participante'} />
                                      <AvatarFallback>{p.name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent><p>{p.name}</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )) : (
                      <p className="text-sm text-muted-foreground pl-2">Nadie asignado</p>
                    )}
                </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsParticipantModalOpen(true)}>
                <Users className="mr-2 h-4 w-4" /> Agregar / Editar Participantes
            </Button>
        </div>

        <main className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <aside className="lg:col-span-1 h-[50vh] lg:h-[calc(100vh_-_12rem)] lg:sticky top-24 rounded-lg overflow-hidden shadow-lg mt-8 lg:mt-0 order-first lg:order-last">
                {googleMapsApiKey ? (
                    <MapDisplayLoader 
                        activities={activitiesForMap}
                        userAddress={activeUserAddress}
                        apiKey={googleMapsApiKey}
                    />
                ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-center p-4">
                       <p className="text-muted-foreground">La API Key de Google Maps no está configurada.</p>
                    </div>
                )}
            </aside>
            <div className="lg:col-span-2 space-y-8">
                {showMyActivities && <SuggestionCategorySection title="Mis Actividades Seleccionadas" activities={filteredMyActivities} salidaId={salidaId} hideSeeAll={true} />}
                {showSuggestions && <SuggestionCategorySection title="Sugerencias" activities={filteredSuggestions} salidaId={salidaId} />}
                {showLibreGratuito && <SuggestionCategorySection title="Libre y gratuito" activities={filteredLibreGratuito} salidaId={salidaId} />} {/* Use filtered list */}
                {showSoloParaUstedes && <FeaturedSuggestionSection title="Solo para ustedes" activities={filteredSoloParaUstedes} salidaId={salidaId} />} {/* Use filtered list */}
                {showRecuerdos && recuerdos.length > 0 && <HomeRecuerdosSection recuerdos={recuerdos} isLoading={loading} />} {/* Remember section is not filtered by this bar */}

                {/* Message when no activities match search term */}
                {!showMyActivities && !showSuggestions && !showLibreGratuito && !showSoloParaUstedes && searchTerm && (
                    <p className="text-center text-muted-foreground">No se encontraron actividades que coincidan con "{searchTerm}".</p>
                )}
            </div>
        </main>

      </div>

      <Dialog open={isParticipantModalOpen} onOpenChange={setIsParticipantModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Gestionar Participantes</DialogTitle>
                <DialogDescription>
                    Selecciona quiénes participarán en esta salida. Puedes invitar nuevos miembros desde aquí.
                </DialogDescription>
            </DialogHeader>
            <ParticipantSelector 
                selectedParticipantIds={tempSelectedIds}
                onSelectedParticipantIdsChange={setTempSelectedIds}
            />
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsParticipantModalOpen(false)} disabled={isSavingParticipants}>Cancelar</Button>
                <Button onClick={handleSaveParticipants} disabled={isSavingParticipants}>
                    {isSavingParticipants && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Cambios
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
