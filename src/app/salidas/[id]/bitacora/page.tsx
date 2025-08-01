
'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, Camera, MessageSquare, Mic, MapPin } from 'lucide-react';

import AuthCheck from '@/components/AuthCheck';
import SalidaPageHeader from '@/components/salidas/SalidaPageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSalidaById } from '@/lib/actions/salidaActions';
import Link from 'next/link';
import TimelineEvent from '@/components/salidas/bitacora/TimelineEvent';
import type { BitacoraEvent } from '@/lib/types';

interface BitacoraPageProps {
  params: Promise<{ id: string }>;
}

interface SalidaData {
  id: string;
  dateRange: {
    from: Date;
    to: Date | null;
  };
}

// Mock data for demonstration purposes
const mockBitacora: BitacoraEvent[] = [
    {
        id: '1',
        timestamp: new Date('2023-10-26T10:05:00').toISOString(),
        type: 'inicio',
        text: 'Salida iniciada en Parque Metropolitano',
        location: { latitude: -33.4269, longitude: -70.6309 },
    },
    {
        id: '2',
        timestamp: new Date('2023-10-26T11:30:00').toISOString(),
        type: 'foto',
        text: '¡Vista desde el teleférico!',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/actividades%2Fparquemet_01.jpg?alt=media&token=c33e4429-a11f-42fa-9e52-1404941e2227',
    },
    {
        id: '3',
        timestamp: new Date('2023-10-26T13:00:00').toISOString(),
        type: 'comentario',
        text: 'Almorzamos en el pícnic. El día está increíble, mucho sol.',
    },
    {
        id: '4',
        timestamp: new Date('2023-10-26T14:15:00').toISOString(),
        type: 'fin',
        text: 'Salida finalizada. ¡Un gran día!',
        location: { latitude: -33.4275, longitude: -70.6315 },
    }
];


function BitacoraPageContent({ params: paramsPromise }: BitacoraPageProps) {
  const params = use(paramsPromise);
  const { id: salidaId } = params;
  const [salidaData, setSalidaData] = useState<SalidaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [bitacoraEvents, setBitacoraEvents] = useState<BitacoraEvent[]>(mockBitacora); // Using mock data

  const fetchSalidaData = useCallback(async (userId: string) => {
    setLoading(true);
    const data = await getSalidaById(salidaId, userId);
    if (data) {
        setSalidaData({
            id: data.id,
            dateRange: {
                from: data.dateRange.from,
                to: data.dateRange.to || data.dateRange.from,
            }
        });
    } else {
        setSalidaData(null);
    }
    setLoading(false);
  }, [salidaId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchSalidaData(currentUser.uid);
      } else {
        setLoading(false); // No user, stop loading
      }
    });
    return () => unsubscribe();
  }, [fetchSalidaData]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!salidaData) {
    return (
        <div className="container mx-auto py-8 text-center">
            <h1 className="text-2xl font-bold">Salida no encontrada</h1>
            <p className="text-muted-foreground">La salida que buscas no existe o no tienes permiso para verla.</p>
            <Button asChild className="mt-4"><Link href="/inicio">Volver a Inicio</Link></Button>
        </div>
    );
  }

  const formattedDate = salidaData.dateRange.to 
    ? `Del ${format(salidaData.dateRange.from, 'd MMM', { locale: es })} al ${format(salidaData.dateRange.to, 'd MMM yyyy', { locale: es })}`
    : `Para el ${format(salidaData.dateRange.from, 'd MMMM yyyy', { locale: es })}`;

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <SalidaPageHeader
        title="Bitácora de la Salida"
        subtitle={formattedDate}
        salidaId={salidaId}
        userId={user?.uid || null}
        currentStep={4}
      />
      
      <main className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content: Timeline */}
        <div className="lg:col-span-2">
            <div className="space-y-8">
                {bitacoraEvents.length > 0 ? (
                    bitacoraEvents.map(event => (
                        <TimelineEvent key={event.id} event={event} />
                    ))
                ) : (
                    <div className="text-center py-16 bg-muted rounded-lg">
                        <p className="text-muted-foreground">Aún no hay eventos en la bitácora.</p>
                        <p className="text-sm text-muted-foreground mt-1">¡Inicia la salida para comenzar a registrar!</p>
                    </div>
                )}
            </div>
        </div>

        {/* Sidebar: Controls */}
        <aside className="lg:col-span-1 lg:sticky top-24 h-fit">
            <Card className="shadow-lg">
              <CardHeader>
                  <CardTitle>Panel de Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                  <Button size="lg" className="w-full bg-green-600 hover:bg-green-700">
                      <MapPin className="mr-2 h-5 w-5" /> Iniciar Salida
                  </Button>
                   <Button size="lg" variant="destructive" className="w-full">
                      <MapPin className="mr-2 h-5 w-5" /> Finalizar Salida
                  </Button>
                  <hr className="my-4 border-dashed" />
                  <Button variant="outline" className="w-full">
                      <MessageSquare className="mr-2 h-5 w-5" /> Añadir Comentario
                  </Button>
                  <Button variant="outline" className="w-full">
                      <Camera className="mr-2 h-5 w-5" /> Subir Foto/Video
                  </Button>
                   <Button variant="outline" className="w-full">
                      <Mic className="mr-2 h-5 w-5" /> Grabar Nota de Voz
                  </Button>
              </CardContent>
          </Card>
           <p className="text-xs text-muted-foreground text-center mt-4">La exportación a PDF se implementará en una fase futura.</p>
        </aside>
      </main>
    </div>
  );
}

export default function BitacoraPageWrapper(props: BitacoraPageProps) {
  return (
    <AuthCheck>
        <BitacoraPageContent {...props} />
    </AuthCheck>
  )
}
