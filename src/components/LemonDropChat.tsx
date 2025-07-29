
'use client';

import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type { Agent } from '@/lib/types';
import { Skeleton } from './ui/skeleton';

const AiSuggestionsChat = dynamic(
  () => import('@/components/AiSuggestionsChat'),
  {
    loading: () => (
      <div className="flex flex-col h-full bg-card shadow-xl overflow-hidden">
        <div className="p-3 border-b flex items-center gap-3 shrink-0 h-[var(--header-height)]">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="flex-grow p-4 space-y-4">
          <div className="flex items-start gap-3 justify-end">
            <Skeleton className="h-12 w-1/2 rounded-xl" />
            <Skeleton className="h-8 w-8 rounded-full shrink-0 mt-1" />
          </div>
          <div className="flex items-start gap-3 justify-start">
            <Skeleton className="h-8 w-8 rounded-full shrink-0 mt-1" />
            <Skeleton className="h-20 w-4/5 rounded-xl" />
          </div>
        </div>
        <div className="border-t p-3 bg-card">
          <Skeleton className="h-10 flex-grow" />
        </div>
      </div>
    ),
    ssr: false
  }
);

interface LemonDropChatProps {
  activeAgent: Agent | null;
  agents: Agent[];
  setActiveAgent: (agent: Agent) => void;
  isLoading: boolean;
}

export default function LemonDropChat({ activeAgent, agents, setActiveAgent, isLoading }: LemonDropChatProps) {

  return (
    <div className={cn("flex flex-col h-full bg-card text-foreground overflow-hidden")}>
       <div className="flex-grow min-h-0">
         {isLoading ? (
           <div className="flex items-center justify-center h-full">
             <Loader2 className="animate-spin" />
           </div>
         ) : activeAgent ? (
           <AiSuggestionsChat 
              activeAgent={activeAgent} 
              agents={agents}
              setActiveAgent={setActiveAgent}
              isLoadingAgents={isLoading}
           />
         ) : (
           <div className="flex items-center justify-center h-full p-4 text-center">
             <p className="text-muted-foreground">No hay agentes de IA disponibles o no se ha podido cargar.</p>
           </div>
         )}
       </div>
    </div>
  );
}
