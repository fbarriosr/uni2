
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AppRoutes } from '@/lib/urls';
import { Loader2 } from 'lucide-react';

export default function HeroSection() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const href = user ? AppRoutes.inicio : AppRoutes.login;

  return (
    <section className="relative py-24 md:py-36">
      <div className="absolute inset-0">
        <Image
          src="https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/home%2Fhome1.jpg?alt=media&token=93246ffe-b131-446f-a62e-68c83c8d17c4"
          alt="Padre e hijo riendo juntos al aire libre"
          fill
          className="object-cover"
          data-ai-hint="family adventure park"
          priority
        />
        <div className="absolute inset-0 bg-black/60"></div> {/* Darker overlay for better text contrast */}
      </div>
      <div className="container mx-auto px-6 text-center relative z-10">
        <h1 className="text-4xl md:text-6xl font-headline text-white mb-6">
          UNI2: Fines de semana que fortalecen vínculos
        </h1>
        <p className="text-lg md:text-xl text-white/90 mb-4 max-w-3xl mx-auto">
         Transforma los fines de semana en experiencias co-creadas entre padres separados y sus hijos, para fortalecer el vínculo emocional de manera simple y significativa.
        </p>
         <p className="text-base text-white/70 mb-10 max-w-3xl mx-auto">
          Sabemos que la falta de tiempo y herramientas puede deteriorar silenciosamente el vínculo. UNI2 convierte la planificación de actividades en una oportunidad para conectar, reforzar el apego y construir recuerdos valiosos.
        </p>
        <Button size="lg" asChild className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl px-10 py-3 text-lg">
          <Link href={href}>
            {authLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              'Empezar a Crear Recuerdos'
            )}
          </Link>
        </Button>
      </div>
    </section>
  );
}
