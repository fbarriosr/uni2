
import AuthCheck from '@/components/AuthCheck';
import SalidaPageHeader from '@/components/salidas/SalidaPageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSalidaById } from '@/lib/actions/salidaActions';
import { Camera, MapPin, MessageSquare, Mic } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { notFound } from 'next/navigation';

interface BitacoraPageProps {
  params: { id: string };
}

export default async function BitacoraPage({ params }: BitacoraPageProps) {
  const { id: salidaId } = params;
  
  // As this is a server component, we need a way to get the current user ID.
  // This part would require a proper session management system. For now, we'll
  // assume a placeholder or that the data fetching function can handle it.
  // In a real app, you'd get the userId from the session.
  const userId = "placeholder_user_id"; // Replace with actual user session logic
  const salidaData = await getSalidaById(salidaId, userId);

  if (!salidaData) {
    notFound();
  }
  
  const formattedDate = `${format(salidaData.dateRange.from, 'd MMM', { locale: es })} - ${format(salidaData.dateRange.to || salidaData.dateRange.from, 'd MMM yyyy', { locale: es })}`;

  return (
    <AuthCheck>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <SalidaPageHeader
          title="Bitácora de la Salida"
          subtitle={formattedDate}
          salidaId={salidaId}
          userId={userId} // Placeholder
          currentStep={5}
        />
        
        <main className="mt-8 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Controles de la Salida</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button size="lg" className="bg-green-600 hover:bg-green-700">
                        <MapPin className="mr-2 h-5 w-5" /> Iniciar Salida (Registrar GPS)
                    </Button>
                     <Button size="lg" variant="destructive">
                        <MapPin className="mr-2 h-5 w-5" /> Finalizar Salida (Registrar GPS)
                    </Button>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Añadir a la Bitácora</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Button variant="outline" size="lg">
                        <MessageSquare className="mr-2 h-5 w-5" /> Añadir Comentario
                    </Button>
                    <Button variant="outline" size="lg">
                        <Camera className="mr-2 h-5 w-5" /> Subir Foto
                    </Button>
                     <Button variant="outline" size="lg">
                        <Mic className="mr-2 h-5 w-5" /> Grabar Audio
                    </Button>
                </CardContent>
            </Card>

            <div className="text-center py-10">
                <p className="text-muted-foreground">La funcionalidad completa de la bitácora, incluyendo el registro de eventos y la exportación, se implementará en la siguiente fase.</p>
            </div>
        </main>
      </div>
    </AuthCheck>
  );
}
