
'use client';

import type { Activity } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, DollarSign, ArrowRight } from 'lucide-react';
import { AppRoutes } from '@/lib/urls';

interface HorizontalActivityCardProps {
  activity: Activity;
  salidaId?: string;
}

export default function HorizontalActivityCard({ activity, salidaId }: HorizontalActivityCardProps) {
  const imageUrl = activity.mainImage || 'https://placehold.co/400x300.png';
  const imageHint = activity.category.toLowerCase().replace(" ", "-");

  return (
    <Link href={AppRoutes.actividadesDetalle(activity.id, salidaId)} className="block group">
      <Card className="overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 flex flex-col sm:flex-row w-full">
        <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0">
          <Image
            src={imageUrl}
            alt={activity.name}
            fill
            sizes="(max-width: 640px) 100vw, 48px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={imageHint}
          />
        </div>
        <div className="flex flex-col p-4 sm:p-5 flex-grow">
          <Badge variant="outline" className="w-fit mb-2">{activity.category}</Badge>
          <h3 className="text-lg font-headline text-foreground mb-1 group-hover:text-primary transition-colors">{activity.name}</h3>
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <MapPin size={14} className="mr-1.5" />
            <span>{activity.location}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-3 flex-grow whitespace-normal">
            {activity.description}
          </p>
          <div className="flex justify-between items-center mt-auto">
            <div className="flex items-center text-md font-semibold text-foreground">
              <DollarSign size={16} className="mr-1 text-primary" />
              <span>{activity.price === 0 ? 'Gratis' : `${activity.price} CLP`}</span>
            </div>
            <div className="text-primary font-medium flex items-center group-hover:underline">
              Ver más <ArrowRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
