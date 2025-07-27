
'use client';

import type { ItineraryEvent } from '@/lib/types';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Navigation, Trash2, MapPin, Clock, ArrowUp, ArrowDown, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface TimelineCardProps {
  event: ItineraryEvent;
  isEditing: boolean;
  onUpdate: (updatedEvent: Partial<ItineraryEvent>) => void;
  onDelete: () => void;
  onMove: (direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
}

export default function TimelineCard({ event, isEditing, onUpdate, onDelete, onMove, isFirst, isLast }: TimelineCardProps) {
  const { type, time, title, description, duration, imageUrl, aiHint, activityDetails, paid } = event;

  const location = activityDetails?.location;
  const schedule = activityDetails?.schedule;
  const encodedLocation = location ? encodeURIComponent(location) : '';

  const handleInputChange = (field: keyof ItineraryEvent, value: string) => {
    onUpdate({ [field]: value });
  };
  
  const canMoveUp = !isFirst && type !== 'start';
  const canMoveDown = !isLast && type !== 'end';

  const renderStaticTravelCard = () => (
    <div className="p-4 rounded-lg bg-primary/10 text-primary-foreground shadow-sm border border-primary/20">
      <p className="font-bold text-primary">{time}</p>
      <p className="text-foreground">{title}</p>
      {description && <p className="text-xs text-foreground/80">{description}</p>}
    </div>
  );

  const renderStaticActivityCard = () => (
    <Card className="overflow-hidden shadow-lg w-full bg-card">
      {imageUrl && (
        <div className="relative h-40 w-full">
          <Image src={imageUrl} alt={title} fill className="object-cover" data-ai-hint={aiHint} />
          {paid && <Badge className="absolute top-2 right-2 bg-green-600 text-white"><CheckCircle className="mr-1.5 h-3 w-3" /> Pagado</Badge>}
        </div>
      )}
      <div className="p-4">
        <p className="font-bold text-foreground">{time}</p>
        <h3 className="text-lg font-headline text-primary">{title}</h3>
        {duration && <p className="text-sm text-muted-foreground mb-2">{duration}</p>}
        
        <div className="space-y-2 mt-3 text-sm border-t pt-3">
          {location && (
            <div className="flex items-start">
              <MapPin className="mr-2 h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">{location}</span>
            </div>
          )}
          {schedule && (
            <div className="flex items-start">
              <Clock className="mr-2 h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">{schedule}</span>
            </div>
          )}
        </div>
      </div>
      
      {location && (
        <div className="p-3 border-t bg-muted/50">
          <Button variant="outline" className="w-full" asChild>
            <Link href={`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`} target="_blank" rel="noopener noreferrer">
              <Navigation className="mr-2 h-4 w-4" />
              Cómo llegar en Google Maps
            </Link>
          </Button>
        </div>
      )}
    </Card>
  );

  const renderStaticContent = () => {
    switch (type) {
      case 'travel':
      case 'start':
      case 'end':
        return renderStaticTravelCard();
      case 'activity':
      case 'meal': // Let meals be styled like activities for now
        return renderStaticActivityCard();
      default:
        return null;
    }
  };

  const renderEditingContent = () => (
    <div className="relative space-y-2 p-4 border rounded-lg bg-card shadow-md">
       <div className="absolute top-1 right-1 flex gap-1">
            {type !== 'start' && type !== 'end' && (
              <>
                <Button variant="ghost" size="icon" onClick={() => onMove('up')} disabled={!canMoveUp} className="h-7 w-7"><ArrowUp className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => onMove('down')} disabled={!canMoveDown} className="h-7 w-7"><ArrowDown className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={onDelete} className="h-7 w-7 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
              </>
            )}
       </div>
      <Input 
        value={time} 
        onChange={(e) => handleInputChange('time', e.target.value)} 
        placeholder="Hora (ej: 09:00)" 
        className="font-bold"
        type="time"
        disabled={type === 'start' || type === 'end'}
      />
      <Input 
        value={title} 
        onChange={(e) => handleInputChange('title', e.target.value)} 
        placeholder="Título del evento"
        className="text-lg font-headline"
        disabled={type === 'start' || type === 'end' || !!activityDetails}
      />
      {type !== 'start' && type !== 'end' && (
        <Textarea 
          value={description || ''} 
          onChange={(e) => handleInputChange('description', e.target.value)} 
          placeholder="Descripción (ej: Tiempo de viaje)"
          rows={2}
          disabled={!!activityDetails}
        />
      )}
    </div>
  );

  return isEditing ? renderEditingContent() : renderStaticContent();
}
