
'use client';

import { useState, useMemo } from 'react';
import type { Activity } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Gift, Smile, CalendarCheck2, GalleryHorizontalEnd, Star as StarIcon, MapPin as MapPinIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useFilters } from '@/contexts/FilterContext';
import { AppRoutes } from '@/lib/urls';
import dynamic from 'next/dynamic';
import SuggestionCategorySection from '@/components/home/SuggestionCategorySection';
import FeaturedSuggestionSection from '@/components/home/FeaturedSuggestionSection';
import HomeRecuerdosSection from '@/components/home/HomeRecuerdosSection';

// This component contains the original client-side logic of the Home page.
// It receives initial data from its parent Server Component.
export default function HomeClientPage({ initialActivities, salidaId }: { initialActivities: Activity[]; salidaId?: string }) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  // The page starts with data, so loading is only for subsequent client-side updates if any.
  const [isLoading, setIsLoading] = useState<boolean>(!initialActivities);
  const [error, setError] = useState<string | null>(null);

  const { filters, setFilters } = useFilters();
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const searchMatch = filters.search ? activity.name.toLowerCase().includes(filters.search.toLowerCase()) : true;
      const locationMatch = filters.location ? activity.location.toLowerCase().includes(filters.location.toLowerCase()) : true;
      const priceMatch = filters.price === 'any' || !filters.price ? true : (filters.price === 'free' ? activity.price === 0 : activity.price > 0);
      const categoryMatch = filters.category === 'any' || !filters.category ? true : activity.category === filters.category;
      return searchMatch && locationMatch && priceMatch; // removed !activity.hidden
    });
  }, [activities, filters]);

  const acompanantes = [
    { name: 'Monce', src: 'https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/grupos%2Fmonce.jpg?alt=media&token=4837e5fd-bc81-4cff-9a7f-2a28b44bc64c', aiHint: "woman smiling" },
  ];

  const miSalidaButtonsData = [
    { icon: MapPinIcon, label: 'Explora', isActive: true, href: AppRoutes.home },
    { icon: Gift, label: 'Ideas' },
    { icon: Smile, label: 'Match' },
    { icon: CalendarCheck2, label: 'Itinerario' },
    { icon: GalleryHorizontalEnd, label: 'Recuerdos' },
    { icon: StarIcon, label: 'Evaluación' },
  ];

  const HomeHeaderSection = dynamic(() => import('@/components/home/HomeHeaderSection'), { ssr: false });
  const HomeActionsSection = dynamic(() => import('@/components/home/HomeActionsSection'), { ssr: false });
  const MapDisplay = dynamic(() => import('@/components/MapDisplay'), { ssr: false, loading: () => <div className="w-full h-full"><Skeleton className="w-full h-full rounded-lg" /></div> });
  const VerticalSuggestionSection = dynamic(() => import('@/components/home/VerticalSuggestionSection'), { ssr: false });

  const recuerdosMockData = [
    { id: '1', title: 'Cascada en el Parque Natural', date: '21 JUN 2022', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/recuerdos%2Frecuerdos_2.jpg?alt=media&token=8dd975ff-eebf-44e0-a7c9-f53242d30a55', aiHint: 'waterfall nature' },
    { id: '2', title: 'Visita al Canil Comunitario de Mascotas', date: '21 JUN 2023', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/recuerdos%2Frecuerdos_3.jpg?alt=media&token=02f5b45d-1cae-4379-a967-2297d930b12c', aiHint: 'community dogs' },
    { id: '3', title: 'Celebración Especial del Día del Niño en la Plaza', date: '21 JUN 2016', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/recuerdos%2Frecuerdos_1.jpg?alt=media&token=f092f403-971a-4464-b23a-bf71db48507c', aiHint: 'children day' },
  ];

  const suggestionsGeneric = activities.slice(0, 3);
  const suggestionsSoloUstedes = activities.filter(a => a.category === "Solo para ustedes").slice(0, 2);
  const suggestionsLibreGratuito = activities.filter(a => a.category === "Libre y gratuito").slice(0, 3);

  if (isLoading) {
    return (
      <div className="space-y-6 w-full p-4 md:p-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-full">
            <Skeleton className="h-6 w-1/2 mb-3" />
            <div className="flex space-x-4 overflow-hidden">
              <Skeleton className="h-64 w-64 flex-shrink-0 rounded-lg" />
              <Skeleton className="h-64 w-64 flex-shrink-0 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="p-4 md:p-8">
        <HomeHeaderSection acompanantes={acompanantes} />
      </div>
      <div className="px-4 md:px-8">
        <HomeActionsSection filters={filters} setFilters={setFilters} miSalidaButtons={miSalidaButtonsData} />
      </div>

      <div className="flex flex-col lg:flex-row flex-grow gap-6 p-4 md:p-8">
        <div className="lg:w-1/3 h-[400px] lg:h-auto lg:max-h-[800px] rounded-lg shadow-md overflow-hidden bg-muted">
          {googleMapsApiKey ? (
            <MapDisplay activities={filteredActivities} apiKey={googleMapsApiKey} />
          ) : (
            <div className="flex items-center justify-center h-full text-center text-muted-foreground">
              <AlertCircle className="w-6 h-6 mr-2" />
              Google Maps API key not configured.
            </div>
          )}
        </div>

        <div className="lg:w-2/3 flex flex-col space-y-6">
          {error && (
            <Alert variant="destructive" className="mt-4 w-full">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!error && activities.length > 0 && (
            <div className="space-y-8">
              <SuggestionCategorySection title="Sugerencias" activities={suggestionsGeneric} salidaId={salidaId} />
              <FeaturedSuggestionSection title="Solo para ustedes" activities={suggestionsSoloUstedes} salidaId={salidaId} className="my-12" />
              <VerticalSuggestionSection title="Libre y gratuito" activities={suggestionsLibreGratuito} salidaId={salidaId} />
              <HomeRecuerdosSection recuerdos={recuerdosMockData} isLoading={isLoading} />
            </div>
          )}

          {!error && activities.length === 0 && (
            <Alert className="mt-4 w-full">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No hay actividades</AlertTitle>
              <AlertDescription>
                No hay actividades cargadas en el sistema.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
