
import AuthCheck from '@/components/AuthCheck';
import SalidaPageHeader from '@/components/salidas/SalidaPageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSalidaById } from '@/lib/actions/salidaActions';
import { Camera, MapPin, MessageSquare, Mic } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { headers } from 'next/headers';


interface BitacoraPageProps {
  params: { id: string };
}

// NOTE: This is a simplified server component. In a real app with server-side auth,
// you would get the user ID from the session/token. For now, we assume public access
// logic within getSalidaById or pass a placeholder.
// The component is being designed to work with the current structure.
// We'll simulate getting the current user on the server for data fetching.
async function getCurrentUserId() {
  // In a real app, this would involve verifying a session cookie or auth token.
  // For this project, we rely on client-side auth checks primarily,
  // but for server components, we might need a workaround or assume public data access patterns.
  // For now, this function is a placeholder for future server-side auth logic.
  // We'll pass a placeholder or null to our data fetching functions.
  return auth.currentUser?.uid || null;
}


export default async function BitacoraPage({ params }: BitacoraPageProps) {
  const { id: salidaId } = params;
  
  // This approach is simplified. In a production app, robust server-side auth is needed.
  const userId = await getCurrentUserId();
  const salidaData = await getSalidaById(salidaId, userId);

  if (!salidaData) {
    notFound();
  }
  
  const formattedDate = salidaData.dateRange.to 
    ? `Del ${format(salidaData.dateRange.from, 'd MMM', { locale: es })} al ${format(salidaData.dateRange.to, 'd MMM yyyy', { locale: es })}`
    : `Para el ${format(salidaData.dateRange.from, 'd MMMM yyyy', { locale: es })}`;


  return (
    <AuthCheck>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <SalidaPageHeader
          title="Bitácora de la Salida"
          subtitle={formattedDate}
          salidaId={salidaId}
          userId={userId} 
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
