
import { getActivities } from '@/lib/data';
import AuthCheck from '@/components/AuthCheck';
import MatchPageClient from '@/components/salidas/MatchPageClient';
import { notFound } from 'next/navigation';
import type { Activity } from '@/lib/types';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// A loading component to show while the client component is being prepared
function MatchPageLoading() {
  return <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
}

interface MatchPageProps {
  params: { id: string };
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { id: salidaId } = params;

  if (!salidaId) {
    notFound();
  }
  
  // We can pass the full list of activities down to avoid re-fetching inside the client.
  const allActivities: Activity[] = await getActivities();

  return (
    <AuthCheck>
      {/* Wrap the client component in Suspense to handle searchParams and avoid chunk errors */}
      <Suspense fallback={<MatchPageLoading />}>
        <MatchPageClient salidaId={salidaId} allActivities={allActivities} />
      </Suspense>
    </AuthCheck>
  );
}
