
'use client';

import Link from 'next/link';
import type { Activity } from '@/lib/types';
import { AppRoutes } from '@/lib/urls';
import type React from 'react';
import { cn } from '@/lib/utils';
import FeaturedActivityCard from '@/components/home/FeaturedActivityCard';

interface FeaturedSuggestionSectionProps {
  title: string;
  activities: Activity[];
  className?: string;
  salidaId?: string;
}

const FeaturedSuggestionSection: React.FC<FeaturedSuggestionSectionProps> = ({ title, activities: suggestionActivities, className, salidaId }) => {
    const categoryFilter = encodeURIComponent(title);
    const linkHref = salidaId
      ? `${AppRoutes.actividades}?category=${categoryFilter}&salidaId=${salidaId}`
      : `${AppRoutes.actividades}?category=${categoryFilter}`;
    
    return (
        <section className={cn("mb-6", className)}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl md:text-3xl font-headline font-bold text-foreground">{title}</h2>
                <Link href={linkHref} className="text-sm font-medium text-primary hover:underline">Ver todo</Link>
            </div>
            {suggestionActivities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {suggestionActivities.map(activity => (
                        <FeaturedActivityCard key={activity.id} activity={activity} salidaId={salidaId} />
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">No hay sugerencias en esta categoría por el momento.</p>
            )}
        </section>
    );
}

export default FeaturedSuggestionSection;
