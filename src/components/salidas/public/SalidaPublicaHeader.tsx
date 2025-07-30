
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import type { User as UserType } from '@/lib/types';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';


interface SalidaPublicaHeaderProps {
  title: string;
  subtitle: string;
  participants: UserType[];
}

export default function SalidaPublicaHeader({ title, subtitle, participants }: SalidaPublicaHeaderProps) {
  return (
    <header className="mb-8 p-6 bg-card rounded-xl shadow-lg border text-center">
      <h1 className="text-3xl md:text-4xl font-headline text-foreground">{title}</h1>
      <p className="text-lg text-muted-foreground mt-1">{subtitle}</p>
      
      {participants.length > 0 && (
          <div className="mt-4 flex items-center justify-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Participantes:</span>
              <div className="flex -space-x-2">
                  {participants.map(p => (
                      <TooltipProvider key={p.id}>
                          <Tooltip>
                              <TooltipTrigger asChild>
                                <Avatar className="h-9 w-9 border-2 border-background">
                                    <AvatarImage src={p.avatarUrl} alt={p.name || 'participante'} />
                                    <AvatarFallback>{p.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent><p>{p.name}</p></TooltipContent>
                          </Tooltip>
                      </TooltipProvider>
                  ))}
              </div>
          </div>
      )}
    </header>
  );
}
