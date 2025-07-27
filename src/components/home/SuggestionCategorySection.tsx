
'use client';

import Link from 'next/link';
import ActivityCard from '@/components/ActivityCard';
import type { Activity } from '@/lib/types';
import { AppRoutes } from '@/lib/urls';
import type React from 'react';
import { cn } from '@/lib/utils';

interface SuggestionCategorySectionProps {
  title: string;
  activities: Activity[];
  className?: string;
  salidaId?: string;
  hideSeeAll?: boolean;
}

const SuggestionCategorySection: React.FC<SuggestionCategorySectionProps> = ({ title, activities: suggestionActivities, className, salidaId, hideSeeAll = false }) => {
  const linkHref = salidaId ? `${AppRoutes.actividades}?salidaId=${salidaId}` : AppRoutes.actividades;
  
  return (
    <section className={cn("mb-6", className)}>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-headline text-foreground">{title}</h2>
        {!hideSeeAll && (
          <Link href={linkHref} className="text-sm text-primary hover:underline">Ver todo</Link>
        )}
      </div>
      {suggestionActivities.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestionActivities.map(activity => (
              <ActivityCard key={activity.id} activity={activity} salidaId={salidaId} />
            ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No hay sugerencias en esta categoría por el momento.</p>
      )}
    </section>
  );
};
export default SuggestionCategorySection;
