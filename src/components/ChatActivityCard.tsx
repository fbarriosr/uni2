
'use client';

import type { Activity } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, DollarSign, ExternalLink } from 'lucide-react';
import { AppRoutes } from '@/lib/urls';

interface ChatActivityCardProps {
  activity: Activity;
}

export default function ChatActivityCard({ activity }: ChatActivityCardProps) {
  const imageUrl = activity.mainImage || 'https://placehold.co/300x200.png?text=Actividad';

  let imageHint = "activity chat";
  if (activity.id.startsWith('scl-1')) imageHint = "mountain cablecar";
  else if (activity.id.startsWith('scl-2')) imageHint = "science museum";
  else if (activity.id.startsWith('scl-3')) imageHint = "children park";
  else if (imageUrl.includes('PENDIENTE') || imageUrl.includes('Actividad')) imageHint = "placeholder activity";


  return (
    <Card className="mb-3 shadow-md w-full max-w-sm overflow-hidden">
      <CardHeader className="p-0 relative h-32">
        <Image
          src={imageUrl}
          alt={activity.name}
          width={300}
          height={200}
          className="w-full h-full object-cover"
          data-ai-hint={imageHint}
        />
      </CardHeader>
      <CardContent className="p-3">
        <CardTitle className="text-md font-headline mb-1.5 line-clamp-2">{activity.name}</CardTitle>
        <div className="flex items-center text-xs text-muted-foreground mb-1">
          <MapPin size={12} className="mr-1 text-accent" />
          <span className="truncate">{activity.location}</span>
        </div>
        <div className="flex items-center text-xs text-muted-foreground mb-2">
          <DollarSign size={12} className="mr-1 text-accent" />
          <span>{activity.price === 0 ? 'Gratis' : `${activity.price} CLP`}</span>
        </div>
        <div className="flex justify-between items-center">
            <Badge variant="outline" className="text-xs">{activity.category}</Badge>
            <Button variant="ghost" size="sm" asChild className="text-accent hover:text-accent hover:bg-accent/10">
              <Link href={AppRoutes.actividadesDetalle(activity.id)} target="_blank" rel="noopener noreferrer">
                Ver Más <ExternalLink size={14} className="ml-1" />
              </Link>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
