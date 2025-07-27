
'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { suggestActivities, type SuggestActivitiesInput, type SuggestActivitiesOutput } from '@/ai/flows/suggest-activities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Activity } from '@/lib/types'; // For parsing suggestions

const FormSchema = z.object({
  pastRatings: z.string().min(1, "Por favor, introduce algunas valoraciones pasadas."),
  location: z.string().min(1, "La ubicación es requerida."),
  availableTime: z.string().min(1, "El tiempo disponible es requerido."),
});

type FormValues = z.infer<typeof FormSchema>;

export default function AiSuggestionsForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Activity[] | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      pastRatings: `[
  {"activityName": "Visita al Zoo", "rating": 4, "notes": "A los niños les encantaron los monos."},
  {"activityName": "Tarde de bolos", "rating": 2, "notes": "Demasiado ruidoso y caro."}
]`, // Example format
      location: '',
      availableTime: '',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setSuggestions(null);
    try {
      const input: SuggestActivitiesInput = {
        pastRatings: data.pastRatings,
        location: data.location,
        availableTime: data.availableTime,
      };
      const result: SuggestActivitiesOutput = await suggestActivities(input);
      
      // Attempt to parse the stringified JSON suggestions
      try {
        const parsedSuggestions = JSON.parse(result.suggestions) as Activity[];
        setSuggestions(parsedSuggestions);
        toast({
          title: "Sugerencias Generadas",
          description: "Hemos encontrado algunas actividades para ti.",
        });
      } catch (parseError) {
        console.error("Error parsing suggestions:", parseError);
        toast({
          title: "Error en Sugerencias",
          description: "Recibimos sugerencias, pero no pudimos procesarlas. El formato podría ser incorrecto.",
          variant: "destructive",
        });
        // Fallback: display raw string if parsing fails
        setSuggestions([{ id: 'raw', name: 'Sugerencia (Raw)', description: result.suggestions, location: '', price:0, category: 'Exterior', facilities: [], images:[] }]);
      }

    } catch (error) {
      console.error("Error getting suggestions:", error);
      toast({
        title: "Error al generar sugerencias",
        description: "Hubo un problema al contactar con el servicio de IA. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-primary flex items-center">
          <Wand2 className="mr-2" /> Asistente de Actividades IA
        </CardTitle>
        <CardDescription>
          Cuéntanos tus preferencias y te ayudaremos a encontrar la actividad perfecta.
          Proporciona tus valoraciones pasadas en formato JSON.
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="pastRatings" className="font-semibold">Valoraciones Pasadas (JSON)</Label>
            <Textarea
              id="pastRatings"
              {...form.register('pastRatings')}
              rows={8}
              className="mt-1"
              placeholder='Ej: [{"activityName": "Museo de Arte", "rating": 5}, {"activityName": "Parque Acuático", "rating": 3}]'
            />
            {form.formState.errors.pastRatings && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.pastRatings.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="location" className="font-semibold">Tu Ubicación Actual</Label>
            <Input
              id="location"
              {...form.register('location')}
              className="mt-1"
              placeholder="Ej: Madrid Centro"
            />
            {form.formState.errors.location && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.location.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="availableTime" className="font-semibold">Tiempo Disponible</Label>
            <Input
              id="availableTime"
              {...form.register('availableTime')}
              className="mt-1"
              placeholder="Ej: 3 horas, toda la tarde, fin de semana"
            />
            {form.formState.errors.availableTime && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.availableTime.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Obtener Sugerencias
          </Button>
        </CardFooter>
      </form>

      {suggestions && suggestions.length > 0 && (
        <div className="mt-8 p-6 border-t">
          <h3 className="text-2xl font-headline text-primary mb-4">Sugerencias para ti:</h3>
          <div className="space-y-4">
            {suggestions.map((sug, index) => (
              <Card key={sug.id || index} className="bg-secondary/30">
                <CardHeader>
                  <CardTitle className="font-headline">{sug.name || `Sugerencia ${index + 1}`}</CardTitle>
                  {sug.location && <CardDescription>{sug.location}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <p>{sug.description || "No hay descripción detallada."}</p>
                  {/* Add more details if available in 'sug' object */}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      {suggestions && suggestions.length === 0 && !isLoading && (
        <div className="mt-8 p-6 border-t text-center text-muted-foreground">
          <p>No hemos encontrado sugerencias con estos criterios. Prueba a ajustarlos.</p>
        </div>
      )}
    </Card>
  );
}
