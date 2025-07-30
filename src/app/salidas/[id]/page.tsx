

import { getActivities } from '@/lib/data';
import AuthCheck from '@/components/AuthCheck';
import SalidaDetailClientPage from '@/components/salidas/SalidaDetailClientPage';
import { notFound } from 'next/navigation';
import type { Activity } from '@/lib/types';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface SalidaDetailPageProps {
  params: { id: string };
}

function SalidaDetailLoading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}

// This is now a Server Component
export default async function SalidaDetailPage({ params }: SalidaDetailPageProps) {
  const { id: salidaId } = params;

  if (!salidaId) {
    notFound();
  }

  // Fetch non-user-specific data here on the server.
  const activities: Activity[] = await getActivities();

  // The client component will handle user-specific data fetching (like the salida details)
  // because it depends on the currently authenticated user.
  return (
    <AuthCheck>
      <Suspense fallback={<SalidaDetailLoading/>}>
        <SalidaDetailClientPage salidaId={salidaId} initialActivities={activities} />
      </Suspense>
    </AuthCheck>
  );
}
