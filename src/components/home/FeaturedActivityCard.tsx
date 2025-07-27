
'use client';

import type { Activity } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, DollarSign, Star, Award } from 'lucide-react'; // Added Award icon
import { AppRoutes } from '@/lib/urls';

interface FeaturedActivityCardProps {
  activity: Activity;
  salidaId?: string;
}

export default function FeaturedActivityCard({ activity, salidaId }: FeaturedActivityCardProps) {
    const imageUrl = activity.mainImage || 'https://placehold.co/600x400.png';
    let imageHint = "featured activity";
    if (activity.id.startsWith('scl-1')) imageHint = "mountain cablecar";
    else if (activity.id.startsWith('scl-2')) imageHint = "science museum";

    return (
        <div className="w-96 flex-shrink-0"> {/* Increased width */}
            <Link href={AppRoutes.actividadesDetalle(activity.id, salidaId)} className="block group h-full">
                {/* Enhanced card styles with border and shadow on hover */}
                <Card className="overflow-hidden shadow-xl border-2 border-primary/30 hover:border-primary hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-2 h-full flex flex-col">
                    <CardHeader className="p-0 relative">
                        <Image
                            src={imageUrl}
                            alt={activity.name}
                            width={400}
                            height={300} // Increased height
                            className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105"
                            data-ai-hint={imageHint}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-4">
                            {/* Larger title */}
                            <CardTitle className="text-2xl font-headline text-white mb-1 whitespace-normal">{activity.name}</CardTitle>
                        </div>
                        {/* Rating Badge */}
                        {activity.averageRating && (
                            <Badge variant="outline" className="absolute top-3 right-3 flex items-center gap-1 bg-background shadow-lg">
                                <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                {activity.averageRating.toFixed(1)}
                            </Badge>
                        )}
                        {/* New "Destacado" Badge */}
                        <Badge variant="default" className="absolute top-3 left-3 flex items-center gap-1.5 shadow-md animate-pulse">
                            <Award size={14} />
                            Destacado
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-4 flex-grow flex flex-col">
                        <p className="text-sm text-muted-foreground mb-3 flex-grow whitespace-normal">{activity.description}</p>
                        <div className="space-y-1 text-sm mt-auto">
                            <div className="flex items-center text-muted-foreground">
                                <MapPin size={14} className="mr-2 text-primary" />
                                <span className="whitespace-normal">{activity.location}</span>
                            </div>
                            <div className="flex items-center text-muted-foreground">
                                <DollarSign size={14} className="mr-2 text-primary" />
                                <span>{activity.price === 0 ? 'Gratis' : `${activity.price} CLP`}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </div>
    );
}
