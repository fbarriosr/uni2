
import type { ItineraryEvent } from '@/lib/types';
import TimelineItem from './TimelineItem';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface ItineraryTimelineProps {
  items: ItineraryEvent[];
  isEditing: boolean;
  onUpdateItinerary: (eventId: string, updatedEvent: Partial<ItineraryEvent>) => void;
  onDeleteItem: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export default function ItineraryTimeline({ items, isEditing, onUpdateItinerary, onDeleteItem, onReorder }: ItineraryTimelineProps) {
  if (!items || items.length === 0) {
    return <p className="text-center text-muted-foreground py-10">No hay eventos en el itinerario para este día.</p>;
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? index - 1 : index + 1;
    if (toIndex >= 0 && toIndex < items.length) {
        onReorder(index, toIndex);
    }
  };


  return (
    <div className="relative pl-6 py-4">
      {/* The main vertical line */}
      <div className="absolute left-6 top-0 h-full w-0.5 bg-border -translate-x-1/2"></div>
      
      <div className="space-y-10">
        {items.map((item, index) => (
          <TimelineItem 
            key={item.id} 
            event={item}
            isFirst={index === 0}
            isLast={index === items.length - 1} 
            align={index % 2 === 0 ? 'left' : 'right'} 
            isEditing={isEditing}
            onUpdate={(updatedEvent) => onUpdateItinerary(item.id, updatedEvent)}
            onDelete={() => onDeleteItem(item.id)}
            onMove={(direction) => moveItem(index, direction)}
          />
        ))}
      </div>
    </div>
  );
}
