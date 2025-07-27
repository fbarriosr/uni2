
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function FinalCtaSection() {
  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-headline mb-6 text-white">
          Deja de Adivinar. Empiecen a Conectar.
        </h2>
        <p className="text-lg mb-10 max-w-xl mx-auto">
          Prueba el sistema de co-creación y descubre una nueva forma de planificar con tus hijos. Menos estrés, más unión.
        </p>
        <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90 shadow-lg font-semibold py-3 px-8 text-lg">
          <Link href="/login">Empezar a Crear Recuerdos</Link>
        </Button>
      </div>
    </section>
  );
}
