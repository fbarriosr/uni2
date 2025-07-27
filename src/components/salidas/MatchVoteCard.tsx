
'use client';
import type { RequestedActivity, UserRole, User } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';
import { ThumbsUp, ThumbsDown, Check, Loader2, User as UserIcon, Crown, MapPin, DollarSign, ArrowRight, Sparkles, Hourglass } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Badge } from '../ui/badge';
import { AppRoutes } from '@/lib/urls';


interface MatchVoteCardProps {
  request: RequestedActivity;
  salidaId: string;
  onVote: (activityId: string, vote: 'liked' | 'disliked') => void;
  onConfirmByParent: (activityId: string) => void;
  isUpdating?: boolean;
  currentUserRole: UserRole | null;
  currentUserId: string | null;
  participants: User[];
}

const getStatusBadge = (status: RequestedActivity['status']) => {
    switch (status) {
        case 'matched':
            return <Badge variant="default" className="bg-green-600 hover:bg-green-700 shadow-lg border-2 border-white/50"><Sparkles className="mr-1.5 h-4 w-4" /> ¡Match!</Badge>;
        case 'selected_by_parent':
            return <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 shadow-lg border-2 border-white/50"><Crown className="mr-1.5 h-4 w-4" /> Confirmado</Badge>;
        case 'rejected':
            return <Badge variant="destructive" className="shadow-lg border-2 border-white/50">Rechazado</Badge>;
        default: // pending
             return <Badge variant="outline" className="bg-background/80 backdrop-blur-sm shadow-lg border-2 border-white/50"><Hourglass className="mr-1.5 h-4 w-4" /> Pendiente</Badge>;
    }
}


export default function MatchVoteCard({ request, salidaId, onVote, onConfirmByParent, isUpdating = false, currentUserRole, currentUserId, participants }: MatchVoteCardProps) {
  const { activityDetails, status, id: activityId, createdByUid, votes } = request;
  if (!activityDetails) return null;

  const creator = participants.find(p => p.id === createdByUid);
  const imageUrl = activityDetails.mainImage || 'https://placehold.co/400x400.png';
  const imageHint = activityDetails.category?.toLowerCase().replace(' ', '-') || 'activity';

  const canCurrentUserVote = currentUserId && !votes[currentUserId];
  const canParentConfirm = currentUserRole !== 'hijo' && status === 'pending';
  const isParent = currentUserRole !== 'hijo';

  return (
    <Card className="overflow-hidden shadow-lg group transition-all duration-300 ease-in-out w-full border-2 border-transparent hover:border-primary/50 flex flex-col">
      <CardHeader className="p-0 relative">
        <div className="relative aspect-[4/3]">
            <Image
            src={imageUrl}
            alt={activityDetails.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            data-ai-hint={imageHint}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute top-2 right-2">{getStatusBadge(status)}</div>

            <TooltipProvider>
                <div className="absolute top-2 left-2 flex gap-1">
                    {Object.entries(votes).map(([userId, vote]) => {
                        const voter = participants.find(p => p.id === userId);
                        return (
                            <Tooltip key={userId}>
                                <TooltipTrigger>
                                    <div className="relative">
                                        <Avatar className="h-8 w-8 border-2 border-white/80">
                                            <AvatarImage src={voter?.avatarUrl} alt={voter?.name || 'Votante'} />
                                            <AvatarFallback><UserIcon size={16} /></AvatarFallback>
                                        </Avatar>
                                        <div className={cn(
                                            "absolute -bottom-1 -right-1 rounded-full p-0.5 text-white",
                                            vote === 'liked' ? 'bg-green-500' : 'bg-red-500'
                                        )}>
                                            {vote === 'liked' ? <ThumbsUp size={10} /> : <ThumbsDown size={10} />}
                                        </div>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{voter?.name || 'Votante'} votó: {vote === 'liked' ? '"Me gusta"' : '"No me gusta"'}</p>
                                </TooltipContent>
                            </Tooltip>
                        )
                    })}
                </div>
            </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow flex flex-col">
        <p className="text-xs text-muted-foreground mb-1">
          Propuesto por: <span className="font-semibold">{creator?.name || 'Usuario'}</span>
        </p>
        <h3 className="font-headline text-lg text-foreground mb-2 leading-tight group-hover:text-primary">
            {activityDetails.name}
        </h3>
        <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
            <div className="flex items-center">
                <MapPin size={14} className="mr-2 flex-shrink-0" />
                <span className="truncate">{activityDetails.location}</span>
            </div>
            {isParent && (
                <div className="flex items-center">
                    <DollarSign size={14} className="mr-2" />
                    <span>{activityDetails.price === 0 ? 'Gratis' : formatCurrency(activityDetails.price)}</span>
                </div>
            )}
        </div>
        <div className="mt-auto flex justify-end">
            <Button variant="link" size="sm" asChild className="h-auto p-0">
                <Link href={AppRoutes.actividadesDetalle(activityId, salidaId)}>
                    Ver todos los detalles <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
            </Button>
        </div>
      </CardContent>
      <CardFooter className="p-3 bg-muted/50 border-t space-y-2 flex-col items-stretch">
        {canCurrentUserVote && (
            <div className="grid grid-cols-2 gap-2 w-full">
            <Button onClick={() => onVote(activityId, 'disliked')} variant="outline" size="sm" disabled={isUpdating}>
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsDown className="mr-1.5" />} No me gusta
            </Button>
            <Button onClick={() => onVote(activityId, 'liked')} size="sm" className="bg-green-600 hover:bg-green-700 text-white" disabled={isUpdating}>
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="mr-1.5" />} ¡Me gusta!
            </Button>
            </div>
        )}
        
        {canParentConfirm && (
            <Button onClick={() => onConfirmByParent(activityId)} variant="secondary" size="sm" className="w-full" disabled={isUpdating}>
            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="mr-1.5" />} Confirmar Actividad
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}
