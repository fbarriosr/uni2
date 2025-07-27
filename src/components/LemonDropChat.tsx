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
      <div className="flex flex-col h-full bg-card shadow-xl rounded-lg overflow-hidden">
        <div className="flex-grow p-4 space-y-4">
          <div className="flex items-start gap-3 justify-start">
            <Skeleton className="h-8 w-8 rounded-full shrink-0 mt-1" />
            <Skeleton className="h-16 w-3/4 rounded-xl" />
          </div>
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
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 flex-grow" />
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>
        </div>
      </div>
    ),
    ssr: false
  }
);

interface LemonDropChatProps {
  agent: Agent | null;
  isLoading: boolean;
}

export default function LemonDropChat({ agent, isLoading }: LemonDropChatProps) {

  return (
    <div className={cn("flex flex-col h-full bg-card text-foreground overflow-hidden")}>
      <div className="flex-grow min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin" />
          </div>
        ) : agent ? (
          <AiSuggestionsChat agent={agent} />
        ) : (
          <div className="flex items-center justify-center h-full p-4 text-center">
            <p className="text-muted-foreground">No hay agentes de IA disponibles o no se ha podido cargar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
