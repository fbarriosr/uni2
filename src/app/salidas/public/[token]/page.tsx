
import { getSalidaByToken } from '@/lib/data';
import { notFound } from 'next/navigation';
import { getItinerary, getUsersByIds } from '@/lib/actions/salidaActions';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import SalidaPublicaHeader from '@/components/salidas/public/SalidaPublicaHeader';
import ItineraryTimeline from '@/components/salidas/itinerary/ItineraryTimeline';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import type { ItineraryEvent as ItineraryEventType, User as UserType } from '@/lib/types';


async function PublicItineraryPage({ params }: { params: { token: string } }) {
  const { token } = params;

  const { salida, ownerId } = await getSalidaByToken(token);

  if (!salida) {
    notFound();
  }
  
  const itinerary = await getItinerary(salida.id, ownerId) || [];
  const participantIds = salida.participantIds || [];
  const participants = participantIds.length > 0 ? await getUsersByIds(participantIds) : [];

  const formattedDateRange = salida.dateRange.to && format(salida.dateRange.from, 'yyyy-MM-dd') !== format(salida.dateRange.to, 'yyyy-MM-dd')
    ? `Del ${format(salida.dateRange.from, 'd MMMM yyyy', { locale: es })} al ${format(salida.dateRange.to, 'd MMMM yyyy', { locale: es })}`
    : `Para el ${format(salida.dateRange.from, 'd MMMM yyyy', { locale: es })}`;
  
  const days = itinerary.reduce((acc, event) => {
    if (!acc.includes(event.date)) {
      acc.push(event.date);
    }
    return acc;
  }, [] as string[]).sort();

  return (
    <div className="bg-muted min-h-screen">
      <div className="container mx-auto py-8 sm:py-12 max-w-3xl">
        <SalidaPublicaHeader
          title="¡Estás invitado a nuestro plan!"
          subtitle={formattedDateRange}
          participants={participants}
        />
        
        <main className="mt-8 space-y-10">
          {days.length > 0 ? days.map(day => {
            const eventsForDay = itinerary.filter(e => e.date === day).sort((a, b) => a.order - b.order);
            return (
              <div key={day}>
                <h2 className="text-2xl font-headline text-primary mb-4 border-b-2 border-primary/20 pb-2">
                  {format(new Date(day), 'EEEE, d \'de\' MMMM', { locale: es })}
                </h2>
                <ItineraryTimeline 
                    items={eventsForDay}
                    isEditing={false}
                    onUpdateItinerary={() => {}}
                    onDeleteItem={() => {}}
                    onReorder={() => {}}
                />
              </div>
            )
          }) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Aún no se ha definido un itinerario para esta salida.</p>
            </div>
          )}
        </main>

        <footer className="text-center mt-12 text-sm text-muted-foreground">
            <p>Plan generado con UNI2</p>
        </footer>
      </div>
    </div>
  );
}

export default PublicItineraryPage;
