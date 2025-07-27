
'use client';

import type { Activity, Address } from '@/lib/types';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import MapDisplay with ssr: false
const DynamicMapDisplay = dynamic(() => import('@/components/MapDisplay'), {
  loading: () => <div className="w-full h-full bg-muted rounded-lg animate-pulse" />, // Use h-full to match container
  ssr: false,
});

interface MapDisplayLoaderProps {
  activities: Activity[];
  userAddress?: Address | null;
  apiKey: string | undefined;
  onBoundsChange?: (bounds: google.maps.LatLngBounds | null) => void;
}

export default function MapDisplayLoader({ activities, userAddress, apiKey, onBoundsChange }: MapDisplayLoaderProps) {
  return <DynamicMapDisplay activities={activities} userAddress={userAddress} apiKey={apiKey} onBoundsChange={onBoundsChange} />;
}
