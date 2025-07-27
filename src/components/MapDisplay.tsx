
'use client';

import { GoogleMap, useJsApiLoader, MarkerF, InfoWindow, MarkerClustererF } from '@react-google-maps/api';
import type { Activity, Address } from '@/lib/types';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPinOff, ArrowRight } from 'lucide-react';
import { AppRoutes } from '@/lib/urls';
import { Card } from './ui/card';

interface MapDisplayProps {
  activities?: Activity[]; // Make optional for picker mode
  userAddress?: Address | null;
  apiKey: string | undefined;
  onBoundsChange?: (bounds: google.maps.LatLngBounds | null) => void;
  // New props for single marker picker mode
  singleMarkerPosition?: { lat: number, lng: number };
  onMarkerDragEnd?: (e: google.maps.MapMouseEvent) => void;
  isMarkerDraggable?: boolean;
}

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem', // Match card rounding
};

// Default center (Santiago, Chile)
const defaultCenter = {
  lat: -33.4489,
  lng: -70.6693,
};

export default function MapDisplay({
  activities = [],
  userAddress,
  apiKey,
  onBoundsChange,
  singleMarkerPosition,
  onMarkerDragEnd,
  isMarkerDraggable = false,
}: MapDisplayProps) {
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || '',
    preventGoogleFontsLoading: true,
  });

  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  
  const onLoad = useCallback(function callback(map: google.maps.Map) {
    mapRef.current = map;
    // Call on initial load
    if (onBoundsChange) {
      onBoundsChange(map.getBounds() ?? null);
    }
  }, [onBoundsChange]);
  
  useEffect(() => {
    if (isLoaded && mapRef.current && (userAddress || activities.length > 0 || singleMarkerPosition)) {
      const bounds = new window.google.maps.LatLngBounds();
      if (userAddress) {
        bounds.extend(new window.google.maps.LatLng(userAddress.latitude, userAddress.longitude));
      }
      activities.forEach(activity => {
        if (activity.latitude && activity.longitude) {
          bounds.extend(new window.google.maps.LatLng(activity.latitude, activity.longitude));
        }
      });
       if (singleMarkerPosition) {
        bounds.extend(new window.google.maps.LatLng(singleMarkerPosition.lat, singleMarkerPosition.lng));
      }
      if (!bounds.isEmpty()) {
          if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
             // If only one point, center and zoom
             mapRef.current.setCenter(bounds.getCenter());
             mapRef.current.setZoom(14);
          } else {
             // If multiple points, fit bounds
             mapRef.current.fitBounds(bounds, 100);
          }
      }
    }
  }, [isLoaded, userAddress, activities, singleMarkerPosition]);


  const onUnmount = useCallback(function callback() {
    mapRef.current = null;
  }, []);

  const onIdle = () => {
    if (mapRef.current && onBoundsChange) {
      onBoundsChange(mapRef.current.getBounds() ?? null);
    }
  };

  const onMarkerClick = useCallback((activityId: string) => {
    setSelectedActivityId(activityId);
  }, []);

  const onInfoWindowClose = useCallback(() => {
    setSelectedActivityId(null);
  }, []);

  const selectedActivity = useMemo(() => {
    return activities.find(a => a.id === selectedActivityId);
  }, [activities, selectedActivityId]);

  const { center, zoom } = useMemo(() => {
    if (singleMarkerPosition) {
        return { center: singleMarkerPosition, zoom: 16 };
    }
    if (userAddress) {
      return { center: { lat: userAddress.latitude, lng: userAddress.longitude }, zoom: 12 };
    }
    const validActivities = activities.filter(activity =>
      typeof activity.latitude === 'number' && typeof activity.longitude === 'number'
    );
    if (validActivities.length > 0) {
      return {
        center: { lat: validActivities[0].latitude!, lng: validActivities[0].longitude! },
        zoom: 11,
      };
    }
    return { center: defaultCenter, zoom: 11 };
  }, [activities, singleMarkerPosition, userAddress]);


  if (!apiKey) {
    return (
      <Alert variant="default" className="h-full flex flex-col justify-center items-center text-center bg-muted/50">
        <MapPinOff className="h-8 w-8 mb-3 text-muted-foreground" />
        <AlertTitle className="text-lg font-medium text-foreground">Servicio de Mapa No Disponible</AlertTitle>
        <AlertDescription className="text-sm text-muted-foreground">
          En este momento no podemos mostrar el mapa. Por favor, inténtalo más tarde.
        </AlertDescription>
      </Alert>
    );
  }

  if (loadError) {
    return (
      <Alert variant="destructive" className="h-full flex flex-col justify-center items-center text-center">
        <MapPinOff className="h-8 w-8 mb-2 text-destructive" />
        <AlertTitle>Error de Carga del Mapa</AlertTitle>
        <AlertDescription className="text-xs">
          No se pudo cargar el mapa. Verifica la API Key y tu conexión a internet.
        </AlertDescription>
      </Alert>
    );
  }

  if (!isLoaded) {
    return <Skeleton className="w-full h-full rounded-lg" />;
  }

  const clustererOptions = {
    gridSize: 60,
    maxZoom: 15,
  };

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={zoom}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        zoomControlOptions: {
           position: window.google?.maps?.ControlPosition?.RIGHT_TOP,
        },
      }}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onIdle={onBoundsChange ? onIdle : undefined}
      onClick={() => setSelectedActivityId(null)} // Close infowindow when clicking the map
    >
      {singleMarkerPosition ? (
        <MarkerF
          position={singleMarkerPosition}
          draggable={isMarkerDraggable}
          onDragEnd={onMarkerDragEnd}
        />
      ) : (
        <>
            {userAddress && (
                <MarkerF 
                    position={{ lat: userAddress.latitude, lng: userAddress.longitude }}
                    title={userAddress.name}
                    icon={{
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: "hsl(var(--primary))",
                        fillOpacity: 1,
                        strokeColor: "white",
                        strokeWeight: 2,
                    }}
                    onClick={() => setSelectedActivityId(userAddress.id)}
                />
            )}
            <MarkerClustererF options={clustererOptions}>
            {(clusterer) =>
                activities.map((activity) => (
                activity.latitude && activity.longitude && (
                  <MarkerF
                      key={activity.id}
                      position={{ lat: activity.latitude, lng: activity.longitude }}
                      title={activity.name}
                      clusterer={clusterer}
                      onClick={() => onMarkerClick(activity.id)}
                  />
                )
                ))
            }
            </MarkerClustererF>
            
            {selectedActivityId === userAddress?.id && userAddress && (
              <InfoWindow
                position={{ lat: userAddress.latitude, lng: userAddress.longitude }}
                onCloseClick={onInfoWindowClose}
                options={{ pixelOffset: new window.google.maps.Size(0, -40) }}
              >
                  <div className="bg-card text-card-foreground p-3 rounded-lg shadow-lg font-semibold">
                      <p>{userAddress.name}</p>
                  </div>
              </InfoWindow>
            )}

            {selectedActivity && selectedActivity.latitude && selectedActivity.longitude && (
            <InfoWindow
                position={{ lat: selectedActivity.latitude, lng: selectedActivity.longitude }}
                onCloseClick={onInfoWindowClose}
                options={{ pixelOffset: new window.google.maps.Size(0, -40) }}
            >
                <div className="bg-card text-card-foreground rounded-lg shadow-lg overflow-hidden w-64">
                    <div className="relative h-32 w-full">
                        <Image
                            src={selectedActivity.mainImage || 'https://placehold.co/400x300.png'}
                            alt={selectedActivity.name}
                            fill
                            className="object-cover"
                            data-ai-hint="activity photo"
                        />
                    </div>
                    <div className="p-3">
                        <h3 className="font-headline text-md mb-1 text-primary truncate">{selectedActivity.name}</h3>
                        <p className="text-xs text-muted-foreground mb-2 truncate">{selectedActivity.location}</p>
                        <Link href={AppRoutes.actividadesDetalle(selectedActivity.id)} className="text-xs text-accent hover:underline font-semibold flex items-center group">
                            Ver detalles <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>
            </InfoWindow>
            )}
        </>
      )}
    </GoogleMap>
  );
}
