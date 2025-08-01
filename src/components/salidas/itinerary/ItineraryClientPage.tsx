
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { format, addDays, eachDayOfInterval, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';

import type { Activity, ItineraryEvent, UserRole, BitacoraEvent } from '@/lib/types';
import { Loader2, Calendar, Pencil, Save, X, Share2, PlusCircle, Home, MapPin } from 'lucide-react';
import SalidaPageHeader from '../SalidaPageHeader';
import { Button } from '@/components/ui/button';
import ItineraryTimeline from './ItineraryTimeline';
import { useToast } from '@/hooks/use-toast';
import { getSalidaById, getItinerary, saveItinerary, getConfirmedPaidActivities } from '@/lib/actions/salidaActions';
import { getUserById } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


interface ItineraryClientPageProps {
  salidaId: string;
  allActivities: Activity[];
}

interface SalidaData {
  id: string;
  dateRange: {
    from: Date;
    to: Date; // Ensure 'to' is always a Date for simplicity
  };
  evaluationSubmitted?: boolean;
}

// Generates a default structure for a new itinerary day
const createDefaultDayItinerary = (date: string): ItineraryEvent[] => [
    { id: uuidv4(), date, type: 'start', time: '09:00', title: 'Comienzo del día', icon: 'Home', order: 0 },
    { id: uuidv4(), date, type: 'end', time: '20:00', title: 'Fin del día', icon: 'Home', order: 999 }, // High order number
];

const UnscheduledActivitiesPool = ({ activities, onAdd }: { activities: Activity[], onAdd: (activity: Activity) => void }) => (
    <Card className="mt-6 border-dashed">
        <CardHeader>
            <CardTitle>Actividades Pagadas por Asignar</CardTitle>
        </CardHeader>
        <CardContent>
            {activities.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {activities.map(activity => (
                        <Card key={activity.id} className="overflow-hidden flex flex-col">
                            <Image src={activity.mainImage || 'https://placehold.co/300x150.png'} alt={activity.name} width={300} height={150} className="w-full h-24 object-cover" />
                            <div className="p-3 flex flex-col flex-grow">
                                <h4 className="font-semibold text-sm leading-tight flex-grow">{activity.name}</h4>
                                <Button size="sm" className="mt-2 w-full" onClick={() => onAdd(activity)}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Añadir al día
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground text-sm text-center py-4">¡Excelente! Todas las actividades pagadas ya están en tu itinerario.</p>
            )}
        </CardContent>
    </Card>
);

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      height="1em"
      width="1em"
      {...props}
    >
      <path d="M16.75 13.96c.25.13.41.2.46.3.06.1.04.68-.12 1.32-.15.64-.84 1.2-1.42 1.25-.58.05-1.12-.19-2.03-.84-.9-.65-1.63-1.42-2.3-2.45-.67-1.03-1.09-2.09-1.07-2.17.02-.08.15-.14.28-.14.14,0, .28,0, .39-.01.12,0, .28-.01.44.45.15.46.52,1.26.57,1.35.05.09.08.14.01.23-.07.09-.15.15-.28.26-.13.12-.25.26-.38.39-.12.13-.26.26-.12.51.13.25.69,1.17,1.52,1.9.83.73,1.6,1,1.82,1.07.22.07.36.06.49-.07.13-.13.56-0.62.71-0.83.15-.21.29-.19.49-.12zM21 4.938A9.967 9.967 0 0012.015 2C6.486 2 2 6.485 2 12.013c0 1.895.52 3.79 1.485 5.48L2 22l4.625-1.45A9.94 9.94 0 0012.015 22c5.527 0 10.015-4.485 10.015-10.012A9.974 9.974 0 0021 4.938z" />
    </svg>
);


export default function ItineraryClientPage({ salidaId, allActivities }: ItineraryClientPageProps) {
  const [salidaData, setSalidaData] = useState<SalidaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [itinerary, setItinerary] = useState<Record<string, ItineraryEvent[]>>({});
  const [originalItinerary, setOriginalItinerary] = useState<Record<string, ItineraryEvent[]>>({});
  const [unscheduledActivities, setUnscheduledActivities] = useState<Activity[]>([]);
  const [activeDayTab, setActiveDayTab] = useState('');

  const outingDays = useMemo(() => {
      if (!salidaData) return [];
      return eachDayOfInterval({
          start: salidaData.dateRange.from,
          end: salidaData.dateRange.to,
      });
  }, [salidaData]);

  useEffect(() => {
    if (outingDays.length > 0 && !activeDayTab) {
        setActiveDayTab(format(outingDays[0], 'yyyy-MM-dd'));
    }
  }, [outingDays, activeDayTab]);

  const sortedCurrentDayItinerary = useMemo(() => {
    return itinerary[activeDayTab]?.sort((a, b) => a.order - b.order) || [];
  }, [itinerary, activeDayTab]);


  const handleUpdateEvent = (day: string, eventId: string, updatedEvent: Partial<ItineraryEvent>) => {
    setItinerary(prev => ({
        ...prev,
        [day]: prev[day].map(event => event.id === eventId ? { ...event, ...updatedEvent } : event)
    }));
  };
  
  const handleReorder = (day: string, fromIndex: number, toIndex: number) => {
    setItinerary(prev => {
      const dayEvents = [...prev[day]];
      const [movedItem] = dayEvents.splice(fromIndex, 1);
      dayEvents.splice(toIndex, 0, movedItem);
      // Re-assign order based on new position
      const reorderedEvents = dayEvents.map((event, index) => ({ ...event, order: index }));
      return { ...prev, [day]: reorderedEvents };
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    
    const flatItinerary = Object.values(itinerary).flat();
    const result = await saveItinerary(salidaId, user.uid, flatItinerary);

    if (result.success) {
      setOriginalItinerary(itinerary);
      setIsEditing(false);
      toast({ title: "Itinerario Guardado", description: "Tus cambios han sido guardados." });
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    setIsSaving(false);
  };
  
  const handleCancel = () => {
    setItinerary(originalItinerary);
    setIsEditing(false);
  };

  const handleAddItemToDay = useCallback((activity: Activity) => {
      if (!activeDayTab) return;

      const newEvent: ItineraryEvent = {
          id: uuidv4(),
          type: 'activity',
          time: '12:00',
          title: activity.name,
          description: activity.description,
          icon: 'MapPin',
          order: (itinerary[activeDayTab]?.length || 0) -1,
          date: activeDayTab,
          activityId: activity.id,
          activityDetails: activity,
          paid: true,
          imageUrl: activity.mainImage
      };
      
      setItinerary(prev => {
          const dayEvents = [...(prev[activeDayTab] || [])];
          const endIndex = dayEvents.findIndex(e => e.type === 'end');
          if (endIndex !== -1) {
              dayEvents.splice(endIndex, 0, newEvent);
          } else {
              dayEvents.push(newEvent);
          }
          return { ...prev, [activeDayTab]: dayEvents.map((e, i) => ({ ...e, order: i })) };
      });
      
      setUnscheduledActivities(prev => prev.filter(a => a.id !== activity.id));
      toast({ title: `"${activity.name}" añadido al día.`});

  }, [activeDayTab, itinerary, toast]);


  const handleDeleteItem = (day: string, eventId: string) => {
    setItinerary(prev => ({
        ...prev,
        [day]: prev[day].filter(item => item.id !== eventId)
                      .map((e, i) => ({ ...e, order: i })) // Re-order after deletion
    }));
    toast({ title: "Evento Eliminado"});
  };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if(currentUser) {
          const appUser = await getUserById(currentUser.uid);
          setUserRole(appUser?.role || null);
      } else {
          setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleShareToWhatsApp = () => {
    if (!salidaData || !itinerary) {
      toast({ title: 'Error', description: 'No hay datos de itinerario para compartir.', variant: 'destructive' });
      return;
    }

    let text = `*¡Itinerario para nuestra salida!* 🗓️\n\n`;
    const days = Object.keys(itinerary).sort();

    days.forEach(day => {
      const dayDate = parse(day, 'yyyy-MM-dd', new Date());
      const formattedDay = format(dayDate, "eeee dd 'de' MMMM", { locale: es });
      text += `*${formattedDay.charAt(0).toUpperCase() + formattedDay.slice(1)}*\n`;

      const events = itinerary[day].sort((a, b) => a.order - b.order);
      events.forEach(event => {
        text += ` • _${event.time}_: ${event.title}\n`;
        if (event.type === 'activity' && event.activityDetails?.location) {
          text += `   📍 ${event.activityDetails.location}\n`;
        }
      });
      text += '\n'; // Add a space between days
    });

    text += "Generado con Lemon Match 🍋";
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;

    window.open(whatsappUrl, '_blank');
  };


  useEffect(() => {
    if (!user || !salidaId) return;

    const fetchPageData = async () => {
      setLoading(true);
      try {
        const fetchedSalida = await getSalidaById(salidaId, user.uid);
        if (fetchedSalida) {
          setSalidaData({
            ...fetchedSalida,
            dateRange: {
                from: fetchedSalida.dateRange.from,
                to: fetchedSalida.dateRange.to || fetchedSalida.dateRange.from
            }
          });
          
          const [paidActivities, savedItinerary] = await Promise.all([
            getConfirmedPaidActivities(salidaId, user.uid),
            getItinerary(salidaId, user.uid)
          ]);
          
          const savedItineraryActivityIds = new Set(savedItinerary?.map(e => e.activityId).filter(Boolean));
          const newUnscheduled = paidActivities.filter(a => !savedItineraryActivityIds.has(a.id));
          setUnscheduledActivities(newUnscheduled);
          
          let finalItinerary: Record<string, ItineraryEvent[]> = {};
          const days = eachDayOfInterval({ start: fetchedSalida.dateRange.from, end: fetchedSalida.dateRange.to || fetchedSalida.dateRange.from });
          
          days.forEach(day => {
              const dayString = format(day, 'yyyy-MM-dd');
              const eventsForDay = savedItinerary?.filter(e => e.date === dayString) || [];
              
              if (eventsForDay.length > 0) {
                  finalItinerary[dayString] = eventsForDay.map(event => ({
                      ...event,
                      activityDetails: event.activityId ? allActivities.find(a => a.id === event.activityId) : undefined,
                      paid: event.activityId ? paidActivities.some(pa => pa.id === event.activityId) : false,
                      icon: event.icon || 'MapPin',
                  })).sort((a, b) => a.order - b.order);
              } else {
                  finalItinerary[dayString] = createDefaultDayItinerary(dayString);
              }
          });

          setItinerary(finalItinerary);
          setOriginalItinerary(finalItinerary);
          setActiveDayTab(format(days[0], 'yyyy-MM-dd'));

        } else {
          setSalidaData(null);
        }
      } catch (error) {
        console.error("Error fetching page data:", error);
        toast({ title: "Error", description: "No se pudo cargar la información de la página.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [user, salidaId, allActivities, toast]);

  const currentJourneyStep = useMemo(() => {
    if (!salidaData) return 1;
    if (salidaData.evaluationSubmitted) return 7; // Completed
    const hasItinerary = Object.values(itinerary).some(day => day.some(event => event.type === 'activity'));
    if (hasItinerary) return 3;
    return 3;
  }, [salidaData, itinerary]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  if (!salidaData) {
    return <div className="container mx-auto py-8 text-center"><h1 className="text-2xl font-bold">Salida no encontrada</h1></div>;
  }
  
  const formattedDateRange = `${format(salidaData.dateRange.from, 'd MMM', { locale: es })} - ${format(salidaData.dateRange.to, 'd MMM yyyy', { locale: es })}`;
  const canEdit = userRole !== 'hijo';

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
       <SalidaPageHeader
        title="Mi Itinerario"
        subtitle={formattedDateRange}
        salidaId={salidaId}
        userId={user?.uid || null}
        currentStep={currentJourneyStep}
      >
        {canEdit && (
            <>
                {!isEditing && (
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar Itinerario
                    </Button>
                )}
                {isEditing && (
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                        <X className="mr-2 h-4 w-4" /> Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                        Guardar
                    </Button>
                </div>
                )}
            </>
        )}
      </SalidaPageHeader>
      
      {isEditing && canEdit && (
        <UnscheduledActivitiesPool activities={unscheduledActivities} onAdd={handleAddItemToDay} />
      )}

      <main className="mb-12 mt-8">
        <Tabs value={activeDayTab} onValueChange={setActiveDayTab}>
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {outingDays.map(day => (
              <TabsTrigger key={day.toString()} value={format(day, 'yyyy-MM-dd')}>
                {format(day, 'eeee dd', { locale: es })}
              </TabsTrigger>
            ))}
          </TabsList>
          {outingDays.map(day => {
            const dayString = format(day, 'yyyy-MM-dd');
            return (
              <TabsContent key={day.toString()} value={dayString}>
                <ItineraryTimeline 
                  items={sortedCurrentDayItinerary} 
                  isEditing={isEditing && canEdit}
                  onUpdateItinerary={(eventId, updatedEvent) => handleUpdateEvent(dayString, eventId, updatedEvent)}
                  onDeleteItem={(eventId) => handleDeleteItem(dayString, eventId)}
                  onReorder={(from, to) => handleReorder(dayString, from, to)}
                />
              </TabsContent>
            )
          })}
        </Tabs>
      </main>
    </div>
  );
}
