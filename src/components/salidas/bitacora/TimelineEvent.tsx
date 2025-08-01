
'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import { MapPin, MessageSquare, Camera, Mic, Flag, FlagOff } from 'lucide-react';
import type { BitacoraEvent } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';


const eventIcons = {
    inicio: Flag,
    fin: FlagOff,
    comentario: MessageSquare,
    foto: Camera,
    audio: Mic
};

interface TimelineEventProps {
  event: BitacoraEvent;
}

export default function TimelineEvent({ event }: TimelineEventProps) {
  const Icon = eventIcons[event.type] || MapPin;
  
  return (
    <div className="flex items-start gap-4">
      {/* Icon and Timestamp */}
      <div className="flex flex-col items-center gap-1.5 flex-shrink-0 w-20">
        <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full border-2",
            event.type === 'inicio' ? 'bg-green-100 border-green-300 text-green-700' :
            event.type === 'fin' ? 'bg-red-100 border-red-300 text-red-700' :
            'bg-muted border-border text-muted-foreground'
        )}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          {format(new Date(event.timestamp), 'HH:mm', { locale: es })}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-grow pt-2">
        <Card className="shadow-sm">
            <CardContent className="p-4">
                {event.imageUrl && (
                     <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-md">
                        <Image src={event.imageUrl} alt={event.text || 'Recuerdo'} fill className="object-cover" />
                    </div>
                )}
                <p className="text-sm text-foreground">{event.text}</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
