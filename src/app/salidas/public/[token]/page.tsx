import { getSalidaByToken, getItineraryByToken, getActivityById } from '@/lib/data';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { eachDayOfInterval } from 'date-fns';
import ItineraryTimeline from '@/components/salidas/itinerary/ItineraryTimeline';
import type { ItineraryEvent } from '@/lib/types';
import { Calendar } from 'lucide-react';

interface PublicSalidaPageProps {
    params: { token: string };
}

// This is a public page and does not use AuthCheck.
export default async function PublicSalidaPage({ params }: PublicSalidaPageProps) {
    const { token } = params;
    if (!token) notFound();

    const salida = await getSalidaByToken(token);
    if (!salida) notFound();

    const savedItinerary = await getItineraryByToken(token);

    let itinerary: Record<string, ItineraryEvent[]> = {};
    const outingDays = eachDayOfInterval({
        start: new Date(salida.dateRange.from),
        end: new Date(salida.dateRange.to || salida.dateRange.from),
    });

    const allActivityIds = savedItinerary?.map(e => e.activityId).filter(Boolean) as string[] || [];
    const activitiesData = new Map<string, any>();
    if (allActivityIds.length > 0) {
        const promises = allActivityIds.map(id => getActivityById(id));
        const results = await Promise.all(promises);
        results.forEach((act, index) => {
            if (act) activitiesData.set(allActivityIds[index], act);
        });
    }

    outingDays.forEach(day => {
        const dayString = format(day, 'yyyy-MM-dd');
        const eventsForDay = savedItinerary?.filter(e => e.date === dayString) || [];
        
        if (eventsForDay.length > 0) {
            itinerary[dayString] = eventsForDay.map(event => ({
                ...event,
                activityDetails: event.activityId ? activitiesData.get(event.activityId) : undefined,
                paid: event.paid, // The 'paid' status should come from the event data itself
            })).sort((a, b) => a.order - b.order);
        }
    });

    const formattedDateRange = `${format(new Date(salida.dateRange.from), 'd MMM', { locale: es })} - ${format(new Date(salida.dateRange.to || salida.dateRange.from), 'd MMM yyyy', { locale: es })}`;

    const activeDayTab = outingDays.length > 0 ? format(outingDays[0], 'yyyy-MM-dd') : '';

    return (
        <div className="bg-muted min-h-screen">
            <div className="container mx-auto py-8 px-4 max-w-4xl">
                 <header className="mb-8 text-center p-6 bg-card rounded-xl shadow-lg border">
                     <h1 className="text-3xl md:text-4xl font-headline text-primary">
                        Plan de Salida
                    </h1>
                     <div className="flex items-center justify-center text-lg text-muted-foreground mt-2">
                        <Calendar className="mr-2 h-5 w-5 text-primary" />
                        <span className="font-semibold">{formattedDateRange}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">Estás viendo una invitación. ¡Prepárate para la diversión!</p>
                </header>
                
                 <main className="mb-12">
                    <Tabs defaultValue={activeDayTab} className="w-full">
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
                                    items={itinerary[dayString] || []} 
                                    isEditing={false}
                                    onUpdateItinerary={() => {}}
                                    onDeleteItem={() => {}}
                                    onReorder={() => {}}
                                    />
                                </TabsContent>
                            )
                        })}
                    </Tabs>
                </main>
            </div>
        </div>
    );
}
