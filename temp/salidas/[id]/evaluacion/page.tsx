
import AuthCheck from '@/components/AuthCheck';
import EvaluacionClientPage from '@/components/salidas/evaluacion/EvaluacionClientPage';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface EvaluacionPageProps {
  params: { id: string };
}

function EvaluacionPageLoading() {
  return <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
}

export default async function EvaluacionPage({ params }: EvaluacionPageProps) {
  const { id: salidaId } = params;

  if (!salidaId) {
    notFound();
  }
  
  // Here we would fetch the list of confirmed and paid activities for this outing
  // to pass down to the client component for evaluation.
  // For now, we will mock this inside the client component.

  return (
    <AuthCheck>
      <Suspense fallback={<EvaluacionPageLoading />}>
        <EvaluacionClientPage salidaId={salidaId} />
      </Suspense>
    </AuthCheck>
  );
}
