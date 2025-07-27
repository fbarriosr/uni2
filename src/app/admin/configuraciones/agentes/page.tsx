
import AuthCheck from '@/components/AuthCheck';
import AgentConfigClientPage from '@/components/configuraciones/AgentConfigClientPage';
import { getAgents } from '@/lib/data';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default async function AgentesIAConfigPage() {
  const agents = await getAgents();

  // Sort agents to have Asistente UNI2 first
  const sortedAgents = [...agents].sort((a, b) => {
    if (a.nombre === 'Asistente UNI2') return -1;
    if (b.nombre === 'Asistente UNI2') return 1;
    return 0;
  });

  return (
    <AuthCheck>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
        <AgentConfigClientPage initialAgents={sortedAgents} />
      </Suspense>
    </AuthCheck>
  );
}
