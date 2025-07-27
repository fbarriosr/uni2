
import AuthCheck from '@/components/AuthCheck';
import ItineraryClientPage from '@/components/salidas/itinerary/ItineraryClientPage';
import { getActivities } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface ItineraryPageProps {
  params: { id: string };
}

// A loading component to show while the client component is being prepared
function ItineraryPageLoading() {
  return <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
}

export default async function ItineraryPage({ params }: ItineraryPageProps) {
  const { id: salidaId } = params;

  if (!salidaId) {
    notFound();
  }
  
  const allActivities = await getActivities();

  return (
    <AuthCheck>
      <Suspense fallback={<ItineraryPageLoading />}>
        <ItineraryClientPage salidaId={salidaId} allActivities={allActivities} />
      </Suspense>
    </AuthCheck>
  );
}
