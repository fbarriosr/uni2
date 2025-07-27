
'use client';

import HorizontalCardCarousel from '@/components/HorizontalCardCarousel';

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

interface UpcomingOutingsSectionProps {
  title: string;
  items: CarouselItem[];
  isLoading: boolean;
  emptyMessage: string;
}

export default function UpcomingOutingsSection({ title, items, isLoading, emptyMessage }: UpcomingOutingsSectionProps) {
  return (
    <HorizontalCardCarousel
      title={title}
      items={items}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
    />
  );
}
