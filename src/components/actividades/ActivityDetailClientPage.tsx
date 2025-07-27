
'use client';

import { useState, useEffect } from 'react';
import type { Activity, Comment, User, Address } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, DollarSign, Users, ListChecks, CalendarPlus, Clock, Info, CalendarClock, Loader2, MessageSquare, Wand2, Camera } from 'lucide-react';
import Link from 'next/link';
import MapDisplayLoader from '@/components/MapDisplayLoader';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import React from 'react';
import ImageGallery from '@/components/ImageGallery';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { requestActivityForSalida } from '@/lib/actions/salidaActions';
import { AppRoutes } from '@/lib/urls';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getUserById } from '@/lib/data';

export default function ActivityDetailClientPage({ activity, comments, salidaId }: { activity: Activity, comments: Comment[], salidaId?: string }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(comments?.[0] || null);
  const [activeUserAddress, setActiveUserAddress] = useState<Address | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const appUser = await getUserById(user.uid);
          if (appUser && appUser.addresses && appUser.activeAddressId) {
            const activeAddr = appUser.addresses.find(a => a.id === appUser.activeAddressId);
            setActiveUserAddress(activeAddr || null); // Only set if found
          }
        } catch (error) {
          console.error("Failed to fetch user address in ActivityDetailClientPage:", error);
          setActiveUserAddress(null);
        }
      } else {
        setActiveUserAddress(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleReserveClick = async () => {
    if (!currentUser) {
      toast({ title: "Acción Requerida", description: "Debes iniciar sesión para hacer una solicitud.", variant: "destructive" });
      return;
    }
    if (!salidaId) {
      toast({ title: "Error de Contexto", description: "No se encontró el contexto de la salida para hacer la solicitud.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const result = await requestActivityForSalida(salidaId, activity.id, currentUser.uid);
    toast({
      title: result.success ? "Éxito" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
    setIsSubmitting(false);
  };
  
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const plainActivityForMap: Activity = { ...activity };
  const hasCoordinates = typeof plainActivityForMap.latitude === 'number' && typeof plainActivityForMap.longitude === 'number';
  const mainImageSrc = plainActivityForMap.mainImage || 'https://placehold.co/800x400.png?text=PENDIENTE';
  let mainImageHint = 'activity detail banner';
  if (plainActivityForMap.id.startsWith('scl-1')) mainImageHint = 'santiago cityscape';
  else if (plainActivityForMap.id.startsWith('scl-2')) mainImageHint = 'interactive exhibits';
  else if (plainActivityForMap.id.startsWith('scl-3')) mainImageHint = 'kids playground';
  else if (mainImageSrc.includes('PENDIENTE')) mainImageHint = 'placeholder pending';

  return (
    <div className="w-full">
        <ScrollArea className="h-[calc(100vh-var(--header-height,4rem)-3rem)] pr-3">
          <Card className="overflow-hidden shadow-xl w-full">
            <CardHeader className="p-0 relative">
              <Image
                src={mainImageSrc}
                alt={plainActivityForMap.name || 'Activity Image'}
                width={800}
                height={400}
                className="w-full h-56 sm:h-64 md:h-80 object-cover"
                data-ai-hint={mainImageHint}
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4 md:p-6">
                <h1 className="text-2xl md:text-3xl font-headline text-white mb-1">{plainActivityForMap.name || 'Sin nombre'}</h1>
                <Badge className="bg-white/20 text-white">{plainActivityForMap.category || 'Sin categoría'}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <DetailItem icon={MapPin} title="Ubicación" text={plainActivityForMap.location} />
                <DetailItem icon={DollarSign} title="Precio" text={plainActivityForMap.price === 0 ? 'Gratis' : `${plainActivityForMap.price} CLP`} />
                {plainActivityForMap.duration && <DetailItem icon={Clock} title="Duración Estimada" text={plainActivityForMap.duration} />}
                {plainActivityForMap.schedule && <DetailItem icon={CalendarClock} title="Horario de Atención" text={plainActivityForMap.schedule} />}
                {(plainActivityForMap.averageRating !== undefined && plainActivityForMap.averageRating !== null) && (
                  <DetailItem icon={Users} title="Valoración Media" text={`${plainActivityForMap.averageRating.toFixed(1)} / 5 estrellas`} />
                )}
              </div>
              <Section title="Descripción">
                <p className="text-foreground whitespace-pre-line">{plainActivityForMap.description || 'Sin descripción.'}</p>
              </Section>

              {plainActivityForMap.galleries && plainActivityForMap.galleries.length > 0 && (
                 <Section title="Galería de Fotos" icon={Camera}>
                  <ImageGallery images={plainActivityForMap.galleries} activityName={plainActivityForMap.name} />
                </Section>
              )}

              <Section title="Ubicación en el Mapa">
                <div className="h-80 rounded-lg shadow-md overflow-hidden bg-muted mt-2">
                  {googleMapsApiKey ? (
                    hasCoordinates ? (
                      <MapDisplayLoader
                        activities={[plainActivityForMap]} 
                        userAddress={activeUserAddress}
                        apiKey={googleMapsApiKey}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm px-4 text-center">
                        Coordenadas no disponibles para esta actividad.
                      </div>
                    )
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm px-4 text-center">
                      Falta la API Key de Google Maps (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).
                    </div>
                  )}
                </div>
              </Section>
              
              {plainActivityForMap.facilities?.length > 0 && (
                <Section title="Instalaciones y Servicios" icon={ListChecks}>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
                    {plainActivityForMap.facilities.map((f, i) => <li key={`${f}-${i}`}>{f}</li>)}
                  </ul>
                </Section>
              )}
              {plainActivityForMap.recommendations && (
                <Section title="Recomendaciones" icon={Info}>
                  <p className="bg-primary/10 p-4 rounded-lg border border-primary/20 text-foreground">
                    {plainActivityForMap.recommendations}
                  </p>
                </Section>
              )}
              
              {(activity.iaComment || (comments && comments.length > 0)) && (
                <Section title="Lo que otros dicen" icon={MessageSquare}>
                  <div className="space-y-6">
                    {activity.iaComment && (
                      <div className="flex items-start space-x-4 p-4 bg-gradient-to-br from-primary/10 to-card border border-primary/20 rounded-lg shadow-lg">
                        <Avatar className="h-12 w-12 bg-primary/10">
                            <AvatarFallback className="bg-transparent text-primary"><Wand2 size={24} /></AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-headline text-lg text-primary">Resumen de IA</p>
                          <p className="text-foreground/90 mt-1 whitespace-pre-line">{activity.iaComment}</p>
                        </div>
                      </div>
                    )}
                    
                    {comments && comments.length > 0 && (
                      <div className="space-y-4">
                        <ScrollArea className="w-full whitespace-nowrap rounded-md">
                          <div className="flex w-max space-x-4 p-2">
                            {comments.map((comment) => (
                              <TooltipProvider key={comment.id}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button onClick={() => setSelectedComment(comment)}>
                                      <Avatar className={cn(
                                        "h-14 w-14 transition-all duration-200 cursor-pointer",
                                        selectedComment?.id === comment.id ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "opacity-70 hover:opacity-100"
                                      )}>
                                        <AvatarImage src={comment.avatar} alt={comment.name} data-ai-hint="user avatar" />
                                        <AvatarFallback>{comment.name ? comment.name.charAt(0) : 'U'}</AvatarFallback>
                                      </Avatar>
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{comment.name}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                          </div>
                          <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                        
                        {selectedComment && (
                            <div className="flex items-start space-x-4 p-4 bg-muted rounded-lg transition-all duration-300 min-h-[96px]">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={selectedComment.avatar} alt={selectedComment.name} data-ai-hint="user avatar" />
                                  <AvatarFallback>{selectedComment.name ? selectedComment.name.charAt(0) : 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="font-semibold text-foreground">{selectedComment.name}</p>
                                  <p className="text-muted-foreground mt-1">{selectedComment.commet}</p>
                                </div>
                            </div>
                        )}
                      </div>
                    )}
                  </div>
                </Section>
              )}

              <div className="pt-5 border-t">
                <Button 
                  size="lg" 
                  className="w-full md:w-auto flex items-center gap-2"
                  onClick={handleReserveClick}
                  disabled={!salidaId || isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CalendarPlus size={20} />}
                  Solicitar Actividad para este Plan
                </Button>
                <p className="text-xs text-muted-foreground mt-1.5 text-center md:text-left">
                  {salidaId
                    ? "Se enviará una solicitud de aprobación para esta actividad."
                    : "Para solicitar, primero debes planificar una salida y acceder a esta actividad desde allí."
                  }
                </p>
              </div>
              <div className="mt-6 text-center">
                <Button variant="outline" asChild>
                  <Link href={salidaId ? AppRoutes.salidas.detail(salidaId) : "/"}>Volver</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </ScrollArea>
      </div>
  );
}

function DetailItem({ icon: Icon, title, text }: { icon: any; title: string; text?: string | number }) {
  return (
    <div className="flex items-start space-x-3 p-4 bg-muted rounded-lg border">
      <Icon size={20} className="text-primary mt-0.5 shrink-0" />
      <div>
        <h3 className="font-semibold text-foreground text-base">{title}</h3>
        <p className="text-muted-foreground">{text || 'No disponible'}</p>
      </div>
    </div>
  );
}

function Section({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon?: any }) {
  return (
    <div className="pt-4">
      <h2 className="text-xl md:text-2xl font-headline text-primary mb-3 flex items-center">
        {Icon && <Icon size={22} className="mr-2" />}
        {title}
      </h2>
      {children}
    </div>
  );
}
