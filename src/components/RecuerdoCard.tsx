
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { AppRoutes } from '@/lib/urls';
import type React from 'react';

export interface RecuerdoCardProps {
  title: string;
  date: string;
  imageUrl: string;
  aiHint: string;
  activityId?: string;
  videoUrl?: string;
}

const RecuerdoCard: React.FC<RecuerdoCardProps> = ({ title, date, imageUrl, aiHint, videoUrl, activityId }) => {
  const href = videoUrl || (activityId ? AppRoutes.actividadesDetalle(activityId) : "#");

  return (
    <Link href={href} className="block w-[200px] flex-shrink-0">
      <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow h-[300px] flex flex-col">
        <Image
          src={imageUrl}
          alt={title}
          width={200}
          height={200}
          className="w-full h-[200px] object-cover"
          data-ai-hint={aiHint}
        />
        <CardContent className="p-3 flex flex-col flex-grow justify-center">
          <p className="text-sm font-semibold text-foreground truncate">{title}</p>
          <p className="text-xs text-muted-foreground">{date}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default RecuerdoCard;
