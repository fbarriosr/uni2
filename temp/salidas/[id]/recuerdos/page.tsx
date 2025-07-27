
import AuthCheck from '@/components/AuthCheck';
import RecuerdosClientPage from '@/components/salidas/recuerdos/RecuerdosClientPage';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface RecuerdosPageProps {
  params: { id: string };
}

function RecuerdosPageLoading() {
  return <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
}

export default async function RecuerdosPage({ params }: RecuerdosPageProps) {
  const { id: salidaId } = params;

  if (!salidaId) {
    notFound();
  }
  
  // You could fetch existing memories here if they were stored in DB
  // For now, we pass this responsibility to the client component

  return (
    <AuthCheck>
      <Suspense fallback={<RecuerdosPageLoading />}>
        <RecuerdosClientPage salidaId={salidaId} />
      </Suspense>
    </AuthCheck>
  );
}
