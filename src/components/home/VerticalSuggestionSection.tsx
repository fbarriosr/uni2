
'use client';

import Link from 'next/link';
import type { Activity } from '@/lib/types';
import { AppRoutes } from '@/lib/urls';
import type React from 'react';
import { cn } from '@/lib/utils';
import HorizontalActivityCard from '@/components/home/HorizontalActivityCard';

interface VerticalSuggestionSectionProps {
  title: string;
  activities: Activity[];
  className?: string;
  salidaId?: string;
}

const VerticalSuggestionSection: React.FC<VerticalSuggestionSectionProps> = ({ title, activities, className, salidaId }) => {
  const categoryFilter = encodeURIComponent(title);
  const linkHref = salidaId
    ? `${AppRoutes.actividades}?category=${categoryFilter}&salidaId=${salidaId}`
    : `${AppRoutes.actividades}?category=${categoryFilter}`;
  
  return (
    <section className={cn("mb-6", className)}>
      <div className="flex justify-between items-center mb-3 px-4 sm:px-0">
        <h2 className="text-xl font-headline text-foreground">{title}</h2>
        <Link href={linkHref} className="text-sm text-primary hover:underline">Ver todo</Link>
      </div>
      {activities.length > 0 ? (
        <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex space-x-4">
            {activities.map(activity => (
               <div key={activity.id} className="w-[90vw] max-w-lg flex-shrink-0">
                  <HorizontalActivityCard activity={activity} salidaId={salidaId} />
               </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground px-4 sm:px-0">No hay sugerencias en esta categoría por el momento.</p>
      )}
    </section>
  );
};

export default VerticalSuggestionSection;
