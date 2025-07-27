
'use client';

import React from 'react';
import MemoryCard from '@/components/MemoryCard'; 

interface CarouselItem {
  id: string;
  title: string;
  date: string;
  imageUrl: string;
  aiHint?: string;
  activityId?: string;
  salidaId?: string;
  isSpecialHighlight?: boolean; 
  participantAvatarUrls?: string[];
}

interface HorizontalCardCarouselProps {
  title: string;
  items: CarouselItem[];
  isLoading?: boolean;
  loadingMessage?: string;
  emptyMessage: string;
}

const HorizontalCardCarousel: React.FC<HorizontalCardCarouselProps> = ({
  title,
  items,
  isLoading = false,
  loadingMessage = "Cargando...",
  emptyMessage,
}) => {
  if (isLoading) {
    return (
      <section>
        <h2 className="text-xl md:text-2xl font-headline text-foreground mb-4">{title}</h2>
        <div className="text-muted-foreground text-center py-4">{loadingMessage}</div>
      </section>
    )
  }
  
  if (items.length === 0) {
    return (
       <section>
        <h2 className="text-xl md:text-2xl font-headline text-foreground mb-4">{title}</h2>
        <div className="text-muted-foreground text-center py-4">{emptyMessage}</div>
      </section>
    )
  }

  return (
    <section>
      <h2 className="text-xl md:text-2xl font-headline text-foreground mb-4">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((item) => (
          <MemoryCard
            key={item.id}
            title={item.title}
            date={item.date}
            imageUrl={item.imageUrl}
            aiHint={item.aiHint}
            activityId={item.activityId}
            salidaId={item.salidaId}
            isSpecialHighlight={item.isSpecialHighlight}
            participantAvatarUrls={item.participantAvatarUrls}
          />
        ))}
      </div>
    </section>
  );
};

export default HorizontalCardCarousel;
