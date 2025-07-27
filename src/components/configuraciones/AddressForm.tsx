
'use client';

import { useState, useActionState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { addOrUpdateAddress } from '@/lib/actions/userActions';
import type { Address } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MapPin } from 'lucide-react';
import MapDisplayLoader from '@/components/MapDisplayLoader';

const AddressFormSchema = z.object({
  id: z.string().optional(), // Added id for the form data
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  address: z.string().min(5, { message: 'La dirección debe tener al menos 5 caracteres.' }),
  latitude: z.coerce.number().min(-90, "Latitud inválida").max(90, "Latitud inválida"),
  longitude: z.coerce.number().min(-180, "Longitud inválida").max(180, "Longitud inválida"),
});

type AddressFormValues = z.infer<typeof AddressFormSchema>;

interface AddressFormProps {
  userId: string;
  address: Address | null;
  onFinished: () => void;
}

export default function AddressForm({ userId, address, onFinished }: AddressFormProps) {
  const { toast } = useToast();
  const [state, formAction, isPending] = useActionState(addOrUpdateAddress.bind(null, userId), { success: false, message: "" });
  const [mapPosition, setMapPosition] = useState({ lat: address?.latitude || -33.4489, lng: address?.longitude || -70.6693 });

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(AddressFormSchema),
    defaultValues: {
      id: address?.id || undefined,
      name: address?.name || '',
      address: address?.address || '',
      latitude: address?.latitude || -33.4489,
      longitude: address?.longitude || -70.6693,
    },
  });

  const watchedLat = form.watch('latitude');
  const watchedLng = form.watch('longitude');

  useEffect(() => {
    // Sync map position when form values change (e.g., from manual input)
    if (typeof watchedLat === 'number' && typeof watchedLng === 'number' && !isNaN(watchedLat) && !isNaN(watchedLng)) {
        if (mapPosition.lat !== watchedLat || mapPosition.lng !== watchedLng) {
            setMapPosition({ lat: watchedLat, lng: watchedLng });
        }
    }
  }, [watchedLat, watchedLng, mapPosition]);


  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({ title: "Éxito", description: state.message });
        onFinished();
      } else {
        toast({ title: "Error", description: state.message || "Por favor, corrige los errores.", variant: "destructive" });
      }
    }
  }, [state, onFinished, toast]);

  const handleMarkerDrag = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setMapPosition(pos);
      form.setValue('latitude', pos.lat, { shouldValidate: true });
      form.setValue('longitude', pos.lng, { shouldValidate: true });
    }
  };
  
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <form action={formAction} className="space-y-4">
      {/* Hidden input for the address ID if it exists */}
      <input type="hidden" {...form.register('id')} />

      <div>
        <Label htmlFor="name">Nombre / Etiqueta</Label>
        <Input id="name" {...form.register('name')} placeholder="Ej: Casa, Trabajo..." />
        {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="address">Dirección (Texto descriptivo)</Label>
        <Input id="address" {...form.register('address')} placeholder="Ej: Av. Siempreviva 742, Santiago" />
        {form.formState.errors.address && <p className="text-sm text-destructive mt-1">{form.formState.errors.address.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="latitude">Latitud</Label>
          <Input id="latitude" type="number" step="any" {...form.register('latitude')} />
          {form.formState.errors.latitude && <p className="text-sm text-destructive mt-1">{form.formState.errors.latitude.message}</p>}
        </div>
        <div>
          <Label htmlFor="longitude">Longitud</Label>
          <Input id="longitude" type="number" step="any" {...form.register('longitude')} />
          {form.formState.errors.longitude && <p className="text-sm text-destructive mt-1">{form.formState.errors.longitude.message}</p>}
        </div>
      </div>


      <div className="h-64 w-full rounded-lg overflow-hidden relative">
         <MapDisplayLoader
            apiKey={googleMapsApiKey}
            singleMarkerPosition={mapPosition}
            onMarkerDragEnd={handleMarkerDrag}
            isMarkerDraggable
        />
        <div className="absolute top-2 left-2 bg-background/80 p-2 rounded-lg shadow-md text-xs">
            Arrastra el pin <MapPin className="inline h-4 w-4 text-red-500"/> para ajustar la ubicación.
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onFinished}>Cancelar</Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar Domicilio
        </Button>
      </div>
    </form>
  );
}
