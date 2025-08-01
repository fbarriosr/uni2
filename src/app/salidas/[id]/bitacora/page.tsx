
'use client';

import { useState, useEffect, useCallback, use, ChangeEvent } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, Camera, MessageSquare, Mic, MapPin, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

import AuthCheck from '@/components/AuthCheck';
import SalidaPageHeader from '@/components/salidas/SalidaPageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSalidaById, getBitacoraEvents, addBitacoraEventAction } from '@/lib/actions/salidaActions';
import Link from 'next/link';
import TimelineEvent from '@/components/salidas/bitacora/TimelineEvent';
import type { BitacoraEvent } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

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
  const { id: salidaId } = use(params);
  const { toast } = useToast();
  const [salidaData, setSalidaData] = useState<SalidaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [bitacoraEvents, setBitacoraEvents] = useState<BitacoraEvent[]>([]);

  // Modal States
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoComment, setPhotoComment] = useState('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    },
    accept: { 'image/*': ['.jpeg', '.png', '.gif'] },
    multiple: false
  });


  const fetchSalidaData = useCallback(async (userId: string) => {
    const data = await getSalidaById(salidaId, userId);
    if (data) {
      setSalidaData({
        id: data.id,
        dateRange: { from: data.dateRange.from, to: data.dateRange.to || data.dateRange.from }
      });
      const events = await getBitacoraEvents(salidaId, userId);
      setBitacoraEvents(events);
    } else {
      setSalidaData(null);
    }
  }, [salidaId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(true);
        await fetchSalidaData(currentUser.uid);
        setLoading(false);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [fetchSalidaData]);
  
  const handleAddEvent = async (type: 'inicio' | 'fin' | 'comentario' | 'foto', payload: { text?: string; file?: File | null }) => {
    if (!user) {
        toast({ title: 'Error', description: 'Debes iniciar sesión.', variant: 'destructive'});
        return;
    }
    
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('salidaId', salidaId);
    formData.append('userId', user.uid);
    formData.append('type', type);
    if (payload.text) formData.append('text', payload.text);
    if (payload.file) formData.append('file', payload.file);

    const result = await addBitacoraEventAction(formData);

    if (result.success) {
        toast({ title: 'Éxito', description: 'Evento añadido a la bitácora.' });
        await fetchSalidaData(user.uid);
        // Reset modals
        setIsCommentModalOpen(false);
        setCommentText('');
        setIsPhotoModalOpen(false);
        setPhotoFile(null);
        setPhotoPreview(null);
        setPhotoComment('');
    } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive'});
    }
    setIsSubmitting(false);
  }

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
    <>
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
                  <Button size="lg" className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleAddEvent('inicio', {text: 'Salida iniciada'})}>
                      <MapPin className="mr-2 h-5 w-5" /> Iniciar Salida
                  </Button>
                   <Button size="lg" variant="destructive" className="w-full" onClick={() => handleAddEvent('fin', {text: 'Salida finalizada'})}>
                      <MapPin className="mr-2 h-5 w-5" /> Finalizar Salida
                  </Button>
                  <hr className="my-4 border-dashed" />
                  <Button variant="outline" className="w-full" onClick={() => setIsCommentModalOpen(true)}>
                      <MessageSquare className="mr-2 h-5 w-5" /> Añadir Comentario
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => setIsPhotoModalOpen(true)}>
                      <Camera className="mr-2 h-5 w-5" /> Subir Foto
                  </Button>
                   <Button variant="outline" className="w-full" disabled>
                      <Mic className="mr-2 h-5 w-5" /> Grabar Nota de Voz
                  </Button>
              </CardContent>
          </Card>
           <p className="text-xs text-muted-foreground text-center mt-4">La exportación a PDF se implementará en una fase futura.</p>
        </aside>
      </main>
    </div>

    {/* Comment Modal */}
    <Dialog open={isCommentModalOpen} onOpenChange={setIsCommentModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Añadir Comentario a la Bitácora</DialogTitle>
                <DialogDescription>Describe un momento o un pensamiento durante tu salida.</DialogDescription>
            </DialogHeader>
            <Textarea
                placeholder="Escribe tu comentario aquí..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={4}
            />
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsCommentModalOpen(false)}>Cancelar</Button>
                <Button onClick={() => handleAddEvent('comentario', {text: commentText})} disabled={isSubmitting || !commentText.trim()}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Añadir
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    
    {/* Photo Modal */}
    <Dialog open={isPhotoModalOpen} onOpenChange={setIsPhotoModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Subir Foto a la Bitácora</DialogTitle>
                <DialogDescription>Selecciona una foto y añade un comentario opcional.</DialogDescription>
            </DialogHeader>
            <div {...getRootProps()} className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${ isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50' }`}>
                <input {...getInputProps()} />
                <UploadCloud className="w-10 h-10 text-muted-foreground mb-2" />
                <p className="font-semibold text-foreground">Arrastra o haz clic para seleccionar</p>
                <p className="text-xs text-muted-foreground">una imagen (JPG, PNG, GIF)</p>
            </div>
            {photoPreview && (
                <div className="relative mt-4">
                    <Image src={photoPreview} alt="Preview" width={500} height={300} className="w-full h-auto rounded-md object-contain max-h-64" />
                     <Button variant="destructive" size="icon" className="absolute -top-3 -right-3 rounded-full h-7 w-7" onClick={() => {setPhotoFile(null); setPhotoPreview(null);}}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
             <Textarea
                placeholder="Añade un comentario a tu foto (opcional)..."
                value={photoComment}
                onChange={(e) => setPhotoComment(e.target.value)}
                rows={3}
            />
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsPhotoModalOpen(false)}>Cancelar</Button>
                <Button onClick={() => handleAddEvent('foto', {text: photoComment, file: photoFile})} disabled={isSubmitting || !photoFile}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Subir Foto
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}

export default function BitacoraPageWrapper(props: BitacoraPageProps) {
  return (
    <AuthCheck>
        <BitacoraPageContent {...props} />
    </AuthCheck>
  )
}
