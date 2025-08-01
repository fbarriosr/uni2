
'use client';

import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, Camera, MapPin, MessageSquare, Mic } from 'lucide-react';

import type { SalidaStatus } from '@/lib/types';
import AuthCheck from '@/components/AuthCheck';
import SalidaPageHeader from '@/components/salidas/SalidaPageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSalidaById } from '@/lib/actions/salidaActions';
import Link from 'next/link';

interface BitacoraPageProps {
  params: { id: string };
}

interface SalidaData {
  id: string;
  dateRange: {
    from: Date;
    to: Date | null;
  };
}

function BitacoraPageContent({ params }: BitacoraPageProps) {
  const { id: salidaId } = params;
  const [salidaData, setSalidaData] = useState<SalidaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);

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
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <SalidaPageHeader
        title="Bitácora de la Salida"
        subtitle={formattedDate}
        salidaId={salidaId}
        userId={user?.uid || null}
        currentStep={4} // Corrected step number
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
  );
}

export default function BitacoraPageWrapper(props: BitacoraPageProps) {
  return (
    <AuthCheck>
        <BitacoraPageContent {...props} />
    </AuthCheck>
  )
}
