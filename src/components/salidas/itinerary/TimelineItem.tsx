
'use client';

import type { ItineraryEvent } from '@/lib/types';
import { cn } from '@/lib/utils';
import TimelineCard from './TimelineCard';
import { Home, MapPin, UtensilsCrossed, HelpCircle, type LucideIcon } from 'lucide-react';
import type React from 'react';

// Map of icon names (strings) to actual components
const iconMap: { [key: string]: LucideIcon } = {
  Home,
  MapPin,
  UtensilsCrossed,
};

const getIconComponent = (iconName: string): LucideIcon => {
    return iconMap[iconName] || HelpCircle; // Default to HelpCircle if icon not found
};

interface TimelineItemProps {
  event: ItineraryEvent;
  align: 'left' | 'right';
  isFirst: boolean;
  isLast: boolean;
  isEditing: boolean;
  onUpdate: (updatedEvent: Partial<ItineraryEvent>) => void;
  onDelete: () => void;
  onMove: (direction: 'up' | 'down') => void;
}

export default function TimelineItem({ event, align, isFirst, isLast, isEditing, onUpdate, onDelete, onMove }: TimelineItemProps) {
  const { icon, marker } = event;
  const IconComponent = getIconComponent(icon);

  // On mobile, all items are aligned left (flex-col). On desktop, they alternate.
  const itemAlignmentClass = align === 'left' ? 'md:flex-row' : 'md:flex-row-reverse';

  return (
    <div className={cn('relative flex flex-col md:items-start md:gap-6', itemAlignmentClass)}>
      {/* Timeline Graphic Element - This part is visually centered in the parent's padding */}
      <div className="relative z-10 flex flex-col items-center md:static">
        {/* The Dot/Circle */}
        <div className={cn(
          "w-3 h-3 rounded-full bg-muted-foreground border-2 border-background",
           marker && "w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground font-bold text-sm"
        )}>
          {marker || ''}
        </div>
        {/* The Icon below the dot */}
        <div className="mt-2 text-muted-foreground">
            <IconComponent size={24} />
        </div>
      </div>
      
      {/* Event Content - Takes full width on mobile, and partial on desktop */}
      <div className={cn('w-full mt-4 md:mt-0 md:w-5/12 flex-shrink-0', align === 'right' && 'md:ml-auto')}>
        <TimelineCard 
            event={event} 
            isEditing={isEditing} 
            onUpdate={onUpdate} 
            onDelete={onDelete}
            onMove={onMove}
            isFirst={isFirst}
            isLast={isLast}
        />
      </div>

    </div>
  );
}
