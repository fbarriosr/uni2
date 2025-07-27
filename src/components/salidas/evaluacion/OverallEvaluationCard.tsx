
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import StarRating from './StarRating';
import type { UserRole } from '@/lib/types';

interface OverallEvaluationCardProps {
  overallRating: number;
  onOverallRatingChange: (rating: number) => void;
  bestMoment: string;
  onBestMomentChange: (comment: string) => void;
  generalComment: string;
  onGeneralCommentChange: (comment: string) => void;
  disabled: boolean;
  userRole: UserRole | null;
}

export default function OverallEvaluationCard({
  overallRating,
  onOverallRatingChange,
  bestMoment,
  onBestMomentChange,
  generalComment,
  onGeneralCommentChange,
  disabled,
  userRole,
}: OverallEvaluationCardProps) {
  return (
    <Card className="shadow-lg border">
        <CardHeader>
            <CardTitle>¿Cómo fue la salida en general?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            {userRole !== 'hijo' && (
              <div>
                  <Label className="text-base font-semibold text-foreground">Tu evaluación general</Label>
                  <p className="text-sm text-muted-foreground mb-2">Considerando todo, desde la planificación hasta el regreso a casa.</p>
                  <StarRating rating={overallRating} setRating={onOverallRatingChange} disabled={disabled} />
              </div>
            )}
             <div>
                <Label htmlFor="best-moment" className="text-base font-semibold text-foreground">¿Cuál fue el mejor momento del día?</Label>
                <Textarea
                  id="best-moment"
                  placeholder="Describe ese momento especial que recordarán..."
                  className="mt-2"
                  value={bestMoment}
                  onChange={(e) => onBestMomentChange(e.target.value)}
                  disabled={disabled}
                />
            </div>
             <div>
                <Label htmlFor="general-comment" className="text-base font-semibold text-foreground">Comentarios generales (opcional)</Label>
                <Textarea
                  id="general-comment"
                  placeholder="Cualquier otra cosa que quieras compartir."
                  className="mt-2"
                  value={generalComment}
                  onChange={(e) => onGeneralCommentChange(e.target.value)}
                  disabled={disabled}
                />
            </div>
        </CardContent>
    </Card>
  );
}
