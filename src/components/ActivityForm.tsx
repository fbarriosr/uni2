
'use client';

import { useActionState, useEffect, useState, useRef } from 'react';
import type { Activity, ActivityCategory, ActivityStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { ActivityFormState } from '@/lib/actions/activityActions';
import { activityCategories, activityStatuses } from '@/lib/data';
import { Loader2, Image as ImageIcon, PlusCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';

interface ActivityFormProps {
  activity?: Activity | null;
  formAction: (prevState: ActivityFormState, formData: FormData) => Promise<ActivityFormState>;
  submitButtonText: string;
}

export default function ActivityForm({ activity, formAction, submitButtonText }: ActivityFormProps) {
  const { toast } = useToast();
  const initialState = { message: '', success: false };
  const [state, dispatch, isPending] = useActionState(formAction, initialState);
  const [formKey, setFormKey] = useState(Date.now());
  
  const [status, setStatus] = useState<ActivityStatus>(activity?.status || 'borrador');
  const [category, setCategory] = useState<ActivityCategory>(activity?.category || activityCategories[0]);
  
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(activity?.mainImage || null);
  
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>(activity?.galleries || []);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // When activity data changes (e.g. after a successful update),
    // reset the preview to the new URL from the database.
    if (activity?.mainImage) {
        setMainImagePreview(activity.mainImage);
    }
    if (activity?.galleries) {
        setGalleryImageUrls(activity.galleries);
    }
  }, [activity]);

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? 'Éxito' : 'Error',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
      if (state.success && !activity) { // On successful creation
        setFormKey(Date.now());
        setStatus('borrador');
        setCategory(activityCategories[0]);
        setMainImageFile(null);
        setMainImagePreview(null);
        setGalleryFiles([]);
        setGalleryImageUrls([]);
      } else if (state.success) { // On successful update
        setGalleryFiles([]); // Clear the "to-be-uploaded" files
      }
    }
  }, [state, toast, activity]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMainImageFile(file);
      setMainImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
        setGalleryFiles(prev => [...prev, ...Array.from(event.target.files!)]);
    }
  };

  const removeExistingGalleryImage = (url: string) => {
    setGalleryImageUrls(prev => prev.filter(u => u !== url));
  };
  
  const removeNewGalleryFile = (fileToRemove: File) => {
      setGalleryFiles(prev => prev.filter(f => f !== fileToRemove));
  };


  const customSubmitAction = (formData: FormData) => {
    if (mainImageFile) {
        formData.append('mainImage', mainImageFile);
    }
    formData.delete('galleryFiles'); // Clear previous gallery files before appending new ones
    galleryFiles.forEach((file) => {
        formData.append('galleryFiles', file);
    });
    formData.append('existingGalleryUrls', JSON.stringify(galleryImageUrls));
    dispatch(formData);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary">
          {activity ? 'Editar Actividad' : 'Crear Nueva Actividad'}
        </CardTitle>
      </CardHeader>
      <form key={formKey} action={customSubmitAction}>
        <input type="hidden" name="status" value={status} />
        <input type="hidden" name="category" value={category} />

        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="name">Nombre de la Actividad</Label>
            <Input id="name" name="name" defaultValue={activity?.name || ''} className="mt-1" />
            {state.errors?.name && <p className="text-sm text-destructive mt-1">{state.errors.name[0]}</p>}
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" name="description" defaultValue={activity?.description || ''} rows={5} className="mt-1" />
            {state.errors?.description && <p className="text-sm text-destructive mt-1">{state.errors.description[0]}</p>}
          </div>

          <div>
            <Label htmlFor="location">Ubicación</Label>
            <Input id="location" name="location" defaultValue={activity?.location || ''} className="mt-1" />
            {state.errors?.location && <p className="text-sm text-destructive mt-1">{state.errors.location[0]}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">Precio (CLP)</Label>
               <Input id="price" name="price" type="number" step="1" defaultValue={activity?.price || 0} className="mt-1" />
              {state.errors?.price && <p className="text-sm text-destructive mt-1">{state.errors.price[0]}</p>}
            </div>
             <div>
              <Label htmlFor="averageRating">Valoración (0-5)</Label>
              <Input id="averageRating" name="averageRating" type="number" step="0.1" min="0" max="5" defaultValue={activity?.averageRating ?? ''} className="mt-1" placeholder="Ej: 4.5" />
              {state.errors?.averageRating && <p className="text-sm text-destructive mt-1">{state.errors.averageRating[0]}</p>}
            </div>
            <div>
              <Label htmlFor="status-select">Estado</Label>
              <Select value={status} onValueChange={(value: ActivityStatus) => setStatus(value)}>
                <SelectTrigger id="status-select" className="w-full mt-1">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {activityStatuses.map(statusValue => (
                    <SelectItem key={statusValue} value={statusValue}>{statusValue.charAt(0).toUpperCase() + statusValue.slice(1).replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.errors?.status && <p className="text-sm text-destructive mt-1">{state.errors.status[0]}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="category-select">Categoría</Label>
            <Select value={category} onValueChange={(value: ActivityCategory) => setCategory(value)}>
              <SelectTrigger id="category-select" className="w-full mt-1">
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {activityCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.errors?.category && <p className="text-sm text-destructive mt-1">{state.errors.category[0]}</p>}
          </div>

          {activity ? (
            <>
                <div className="space-y-6 border-t pt-6">
                  <div className="p-3 bg-muted/50 rounded-lg border border-dashed text-sm">
                    <h3 className="font-semibold text-foreground">Imagen Principal</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sube o reemplaza la imagen principal de la actividad.
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-1/2">
                        <Label htmlFor="mainImage">Subir nueva imagen</Label>
                        <Input
                            id="mainImage"
                            name="mainImage"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="mt-1"
                        />
                        {state.errors?.mainImage && <p className="text-sm text-destructive mt-1">{state.errors.mainImage[0]}</p>}
                    </div>
                    <div className="w-1/2">
                        <Label>Previsualización</Label>
                        <div className="mt-1 w-full aspect-video rounded-md border bg-muted flex items-center justify-center">
                        {mainImagePreview ? (
                            <Image
                            src={mainImagePreview}
                            alt="Previsualización de imagen principal"
                            width={200}
                            height={112}
                            className="rounded-md object-cover h-full w-full"
                            />
                        ) : (
                            <div className="flex flex-col items-center text-muted-foreground">
                                <ImageIcon className="h-8 w-8"/>
                                <span className="text-xs mt-1">Sin imagen</span>
                            </div>
                        )}
                        </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 border-t pt-6">
                    <div className="p-3 bg-muted/50 rounded-lg border border-dashed text-sm">
                        <h3 className="font-semibold text-foreground">Galería de Imágenes</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                        Añade o elimina imágenes de la galería.
                        </p>
                    </div>
                    
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleGalleryFileChange}
                        className="hidden"
                        ref={galleryInputRef}
                        name="galleryFiles" // Added name
                    />
                    <Button type="button" variant="outline" onClick={() => galleryInputRef.current?.click()}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Imágenes a la Galería
                    </Button>

                    {state.errors?.galleries && <p className="text-sm text-destructive mt-1">{state.errors.galleries[0]}</p>}

                    {(galleryImageUrls.length > 0 || galleryFiles.length > 0) && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {galleryImageUrls.map((url) => (
                                <div key={url} className="relative group">
                                    <Image src={url} alt="Imagen de galería" width={150} height={150} className="rounded-md object-cover aspect-square w-full" />
                                    <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeExistingGalleryImage(url)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {galleryFiles.map((file, index) => (
                                <div key={index} className="relative group">
                                    <Image src={URL.createObjectURL(file)} alt="Previsualización de imagen" width={150} height={150} className="rounded-md object-cover aspect-square w-full" />
                                    <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeNewGalleryFile(file)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </>
          ) : (
            <div className="p-4 bg-muted/50 rounded-lg border border-dashed text-center">
                <p className="text-sm text-muted-foreground">El precio, imagen principal y otros detalles se agregan después, en la pantalla de edición.</p>
            </div>
          )}
          
          <div>
            <Label htmlFor="facilities">Instalaciones (separadas por comas)</Label>
            <Input id="facilities" name="facilities" defaultValue={activity?.facilities?.join(', ') || ''} className="mt-1" placeholder="Ej: Baños, Cafetería, Wifi" />
            {state.errors?.facilities && <p className="text-sm text-destructive mt-1">{state.errors.facilities[0]}</p>}
          </div>

           <div>
            <Label htmlFor="duration">Duración (opcional)</Label>
            <Input id="duration" name="duration" defaultValue={activity?.duration || ''} className="mt-1" placeholder="Ej: 2-3 horas, Medio día" />
            {state.errors?.duration && <p className="text-sm text-destructive mt-1">{state.errors.duration[0]}</p>}
          </div>

          <div>
            <Label htmlFor="schedule">Horario de Atención (opcional)</Label>
            <Input id="schedule" name="schedule" defaultValue={activity?.schedule || ''} className="mt-1" placeholder="Ej: L-V: 9am-6pm, S: 10am-2pm" />
            {state.errors?.schedule && <p className="text-sm text-destructive mt-1">{state.errors.schedule[0]}</p>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitud (opcional)</Label>
              <Input id="latitude" name="latitude" type="number" step="any" defaultValue={activity?.latitude || ''} className="mt-1" placeholder="Ej: -33.4489" />
              {state.errors?.latitude && <p className="text-sm text-destructive mt-1">{state.errors.latitude[0]}</p>}
            </div>
            <div>
              <Label htmlFor="longitude">Longitud (opcional)</Label>
              <Input id="longitude" name="longitude" type="number" step="any" defaultValue={activity?.longitude || ''} className="mt-1" placeholder="Ej: -70.6693" />
              {state.errors?.longitude && <p className="text-sm text-destructive mt-1">{state.errors.longitude[0]}</p>}
            </div>
          </div>

        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitButtonText}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
