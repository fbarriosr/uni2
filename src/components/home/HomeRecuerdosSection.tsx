
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MemoryCard from '@/components/MemoryCard';
import type React from 'react';
import { cn } from '@/lib/utils';

interface Recuerdo {
  id: string;
  title: string;
  date: string;
  imageUrl: string;
  aiHint: string;
  activityId?: string;
  salidaId?: string;
  participantAvatarUrls?: string[];
  videoUrl?: string;
}
interface HomeRecuerdosSectionProps {
  recuerdos: Recuerdo[];
  isLoading: boolean;
  className?: string;
}

const HomeRecuerdosSection: React.FC<HomeRecuerdosSectionProps> = ({ recuerdos, isLoading, className }) => {
  return (
    <section className={cn(className)}>
      <div className="mb-3">
        <h2 className="text-xl font-headline text-foreground">Recuerdos</h2>
      </div>
       {recuerdos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {recuerdos.map((recuerdo, index) => (
            <MemoryCard
              key={`${recuerdo.id}-${index}`}
              title={recuerdo.title}
              date={recuerdo.date}
              imageUrl={recuerdo.imageUrl}
              aiHint={recuerdo.aiHint}
              activityId={recuerdo.activityId}
              salidaId={recuerdo.salidaId}
              participantAvatarUrls={recuerdo.participantAvatarUrls}
              videoUrl={recuerdo.videoUrl}
            />
          ))}
        </div>
        ) : (
        <div className="text-sm text-muted-foreground text-center py-4 border rounded-lg bg-card">
            No hay recuerdos para mostrar.
        </div>
      )}
    </section>
  );
};
export default HomeRecuerdosSection;
