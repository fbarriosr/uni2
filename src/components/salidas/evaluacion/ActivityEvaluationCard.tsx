
'use client';

import type { Activity, UserRole } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import StarRating from './StarRating';
import EmojiRating from './EmojiRating';

interface ActivityEvaluationCardProps {
  activity: Activity;
  parentRating: number;
  onParentRatingChange: (rating: number) => void;
  childRating: number;
  onChildRatingChange: (rating: number) => void;
  comment: string;
  onCommentChange: (comment: string) => void;
  disabled: boolean;
  userRole: UserRole | null;
}

export default function ActivityEvaluationCard({
  activity,
  parentRating,
  onParentRatingChange,
  childRating,
  onChildRatingChange,
  comment,
  onCommentChange,
  disabled,
  userRole,
}: ActivityEvaluationCardProps) {
  return (
    <Card className="overflow-hidden shadow-lg border">
      <div className="md:flex">
        <div className="md:w-1/3 relative h-48 md:h-auto">
           <Image 
                src={activity.mainImage || 'https://placehold.co/400x400.png'}
                alt={activity.name}
                fill
                className="object-cover"
                data-ai-hint="activity photo"
           />
        </div>
        <div className="md:w-2/3">
          <CardHeader>
            <CardTitle>{activity.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {userRole !== 'hijo' && (
              <div>
                <Label className="text-base font-semibold text-foreground">¿Qué te pareció a ti?</Label>
                <p className="text-sm text-muted-foreground mb-2">Evalúa del 1 al 5.</p>
                <StarRating rating={parentRating} setRating={onParentRatingChange} disabled={disabled} />
              </div>
            )}
            
            <div>
              <Label className="text-base font-semibold text-foreground">{userRole === 'hijo' ? '¿Qué te pareció?' : '¿Y a tu hij@?'}</Label>
              <p className="text-sm text-muted-foreground mb-2">Elige la carita que mejor representa su experiencia.</p>
              <EmojiRating rating={childRating} setRating={onChildRatingChange} disabled={disabled} />
            </div>

            <div>
              <Label htmlFor={`comment-${activity.id}`} className="text-base font-semibold text-foreground">Comentarios sobre la actividad (opcional)</Label>
              <Textarea
                id={`comment-${activity.id}`}
                placeholder="¿Algo que destacar o mejorar?"
                className="mt-2"
                value={comment}
                onChange={(e) => onCommentChange(e.target.value)}
                disabled={disabled}
              />
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
