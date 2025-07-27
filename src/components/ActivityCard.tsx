
import type { Activity } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, DollarSign, Star } from 'lucide-react';
import { AppRoutes } from '@/lib/urls';

interface ActivityCardProps {
  activity: Activity;
  salidaId?: string;
}

export default function ActivityCard({ activity, salidaId }: ActivityCardProps) {
  const imageUrl = activity.mainImage || 'https://placehold.co/600x400.png?text=PENDIENTE';
  
  let imageHint = "activity landscape"; // Default hint
  if (activity.id.startsWith('scl-1')) imageHint = "mountain cablecar";
  else if (activity.id.startsWith('scl-2')) imageHint = "science museum";
  else if (activity.id.startsWith('scl-3')) imageHint = "children park";
  else if (imageUrl.includes('PENDIENTE')) imageHint = "placeholder pending";


  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card flex flex-col h-full">
      <CardHeader className="p-0 relative">
        <Link href={AppRoutes.actividadesDetalle(activity.id, salidaId)} className="block aspect-video">
          <Image
            src={imageUrl}
            alt={activity.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="w-full h-full object-cover"
            data-ai-hint={imageHint}
          />
        </Link>
        {activity.averageRating !== undefined && activity.averageRating !== null && (
          <Badge variant="secondary" className="absolute top-2 right-2 flex items-center gap-1 bg-background/90 backdrop-blur-sm shadow">
            <Star size={14} className="text-yellow-500 fill-yellow-500" />
            <span className="font-semibold">{activity.averageRating.toFixed(1)}</span>
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow flex flex-col">
        <Link href={AppRoutes.actividadesDetalle(activity.id, salidaId)}>
          <CardTitle className="text-lg font-headline mb-3 hover:text-primary transition-colors">{activity.name}</CardTitle>
        </Link>
        <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center">
                <MapPin size={14} className="mr-2 text-primary shrink-0" />
                <span className="line-clamp-1">{activity.location}</span>
            </div>
            <div className="flex items-center">
                <DollarSign size={14} className="mr-2 text-primary shrink-0" />
                <span>{activity.price === 0 ? 'Gratis' : `${activity.price} CLP`}</span>
            </div>
        </div>
        <div className="mt-auto pt-4 flex justify-end">
            <Badge variant="outline">{activity.category}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
