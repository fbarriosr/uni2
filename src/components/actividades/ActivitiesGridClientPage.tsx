
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Activity, ActivityCategory, ActivityFilterCriteria, User, Address } from '@/lib/types';
import ActivityCard from '@/components/ActivityCard';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SearchX, Loader2 } from 'lucide-react';
import { activityCategories } from '@/lib/data';
import MapDisplayLoader from '@/components/MapDisplayLoader';
import { ScrollArea } from '@/components/ui/scroll-area';
import ActivityFilterBar from './ActivityFilterBar';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserById } from '@/lib/data';

interface ActivitiesGridClientPageProps {
  initialActivities: Activity[];
}

export default function ActivitiesGridClientPage({ initialActivities }: ActivitiesGridClientPageProps) {
  const [activities] = useState<Activity[]>(initialActivities);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const [salidaId, setSalidaId] = useState<string | undefined>(undefined);
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [activeUserAddress, setActiveUserAddress] = useState<Address | null>(null);

  const [localFilters, setLocalFilters] = useState<ActivityFilterCriteria>({
    search: undefined,
    location: undefined,
    price: 'any',
    category: 'any',
    averageRating: 0
  });

  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    const salidaIdFromUrl = searchParams.get('salidaId');

    const isValidCategory = activityCategories.some(cat => cat === categoryFromUrl);
    
    setLocalFilters(prev => ({
      ...prev,
      category: isValidCategory ? categoryFromUrl as ActivityCategory : 'any',
    }));
    
    if (salidaIdFromUrl) {
      setSalidaId(salidaIdFromUrl);
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const appUser = await getUserById(user.uid);
                if (appUser && appUser.addresses && appUser.activeAddressId) {
                    const activeAddr = appUser.addresses.find(a => a.id === appUser.activeAddressId);
                    setActiveUserAddress(activeAddr || null);
                }
            } catch (err) {
                console.error("Failed to fetch user address", err);
            }
        }
        setLoading(false);
    });

    return () => unsubscribe();

  }, [searchParams]);

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const searchMatch = localFilters.search
        ? activity.name.toLowerCase().includes(localFilters.search.toLowerCase())
        : true;
      
      const priceMatch = !localFilters.price || localFilters.price === 'any'
        ? true
        : (localFilters.price === 'free' ? activity.price === 0 : activity.price > 0);

      const categoryMatch = !localFilters.category || localFilters.category === 'any'
        ? true
        : activity.category === localFilters.category;
      
      const ratingMatch = localFilters.averageRating
        ? (activity.averageRating || 0) >= localFilters.averageRating
        : true;
      
      return searchMatch && priceMatch && categoryMatch && ratingMatch;
    });
  }, [activities, localFilters]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container mx-auto py-8">
      {/* Filters at the top, full width */}
      <ActivityFilterBar filters={localFilters} onFilterChange={setLocalFilters} />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8">
        
        {/* Scrollable Cards Area (7 columns on lg) */}
        <div className="lg:col-span-7">
          <ScrollArea className="h-auto lg:h-[calc(100vh_-_18rem)] pr-0 lg:pr-4">
            {filteredActivities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredActivities.map(activity => (
                  <ActivityCard key={activity.id} activity={activity} salidaId={salidaId} />
                ))}
              </div>
            ) : (
              <div className="flex justify-center items-center h-full p-8">
                <Alert className="max-w-md text-center bg-transparent border-none shadow-none">
                  <SearchX className="h-5 w-5" />
                  <AlertTitle>No se encontraron resultados</AlertTitle>
                  <AlertDescription>
                    Prueba a cambiar o limpiar los filtros para ver más actividades.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Sticky Map Area (5 columns on lg) */}
        <aside className="lg:col-span-5 h-[50vh] lg:h-[calc(100vh_-_18rem)] lg:sticky top-24 rounded-lg overflow-hidden shadow-lg mt-8 lg:mt-0">
            {googleMapsApiKey ? (
                <MapDisplayLoader 
                    activities={filteredActivities}
                    userAddress={activeUserAddress}
                    apiKey={googleMapsApiKey}
                />
            ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-center p-4">
                   <p className="text-muted-foreground">La API Key de Google Maps no está configurada.</p>
                </div>
            )}
        </aside>

      </div>
    </div>
  );
}
