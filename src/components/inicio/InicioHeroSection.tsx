
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { AppRoutes } from '@/lib/urls';
import { Calendar, Info, Plus, Sparkles } from 'lucide-react';
import type { UserRole } from '@/lib/types';
import { Card } from '@/components/ui/card';

interface UpcomingOutingDisplay {
  id: string; // This is the salidaId
  title: string;
  date: string;
  imageUrl: string;
  aiHint: string;
  activityId?: string; // An activity may or may not be chosen yet
  salidaId?: string; // Explicitly passed
}

interface InicioHeroSectionProps {
  outing: UpcomingOutingDisplay | null;
  userRole?: UserRole;
}

export default function InicioHeroSection({ outing, userRole }: InicioHeroSectionProps) {
  const isChild = userRole === 'hijo';

  if (!outing) {
    if (isChild) {
      return (
        <section className="text-center mb-12 px-4">
          <Card className="bg-primary/5 border-primary/20 p-6 sm:p-8 rounded-2xl shadow-lg">
            <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl sm:text-3xl font-headline text-foreground mb-3">
              ¡Hola! Revisa aquí tus próximas aventuras.
            </h1>
            <p className="text-muted-foreground max-w-prose mx-auto text-sm sm:text-base">
              Cuando tu papá o mamá planifiquen una nueva salida, aparecerá aquí. ¡La diversión está por comenzar!
            </p>
          </Card>
        </section>
      );
    }
    return (
      <section className="text-center mb-12 px-4">
        <Card className="bg-card p-6 sm:p-8 rounded-2xl shadow-lg">
            <h1 className="text-2xl sm:text-3xl font-headline text-foreground mb-3">
              Encuentra actividades fáciles y divertidas para tus hijos
            </h1>
            <p className="text-muted-foreground max-w-prose mx-auto mb-6 text-sm sm:text-base">
                Empieza a planificar y creen recuerdos inolvidables juntos.
            </p>
            <Button size="lg" asChild className="px-8 py-3 text-base shadow-md hover:shadow-lg transition-shadow">
              <Link href={AppRoutes.nueva_salida}>
                <Plus className="mr-2 h-5 w-5" /> Planear mi Próxima Salida
              </Link>
            </Button>
        </Card>
      </section>
    );
  }

  const linkHref = `/salidas/${outing.id}`;

  return (
    <section className="relative w-full h-[50vh] min-h-[450px] md:h-[60vh] rounded-2xl overflow-hidden mb-12 shadow-2xl flex items-center justify-center text-center text-white">
      <Image
        src={outing.imageUrl}
        alt={`Imagen de ${outing.title}`}
        fill
        className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
        data-ai-hint={outing.aiHint}
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
      <div className="relative z-10 p-4 sm:p-6 flex flex-col items-center">
        <p className="font-semibold bg-primary/80 backdrop-blur-sm px-4 py-1 rounded-full mb-3 text-sm md:text-base animate-fade-in-down">
          Tu Próxima Gran Aventura
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-headline text-white mb-3">
          {outing.title}
        </h1>
        <div className="flex items-center text-base sm:text-lg font-medium bg-black/30 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg mb-6">
          <Calendar className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          <span>{outing.date}</span>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-xs sm:max-w-none">
            <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90 shadow-lg font-bold sm:text-lg transform hover:scale-105 transition-transform w-full sm:w-auto">
                <Link href={linkHref}>
                    <Info className="mr-2" />
                    Ver Detalles
                </Link>
            </Button>
            {!isChild && (
              <Button size="lg" variant="default" asChild className="shadow-lg font-bold sm:text-lg transform hover:scale-105 transition-transform w-full sm:w-auto">
                  <Link href={AppRoutes.nueva_salida}>
                      <Plus className="mr-2" />
                      Planear Otra
                  </Link>
              </Button>
            )}
        </div>
      </div>
    </section>
  );
}
