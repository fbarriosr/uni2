
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';

export default function TestimonialsSection() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-headline text-primary text-center mb-12">
          Lo Que Dicen Nuestras Familias
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="shadow-lg border-transparent border-l-4 border-primary transform hover:scale-105 transition-transform duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <Image src="https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/home%2Flaura.png?alt=media&token=b590402f-72a2-43ad-bac7-c283a8ded5f9" alt="Laura P." width={50} height={50} className="rounded-full mr-4" data-ai-hint="happy parent portrait" />
                <div>
                  <h4 className="font-semibold text-foreground">Laura P.</h4>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />)}
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground italic">"Desde que usamos UNI2, los fines de semana son diferentes. Se acabaron las discusiones sobre qué hacer. Ahora mi hija y yo elegimos juntos y ambos estamos felices."</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-transparent border-l-4 border-primary transform hover:scale-105 transition-transform duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <Image src="https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/home%2Fcarlos.png?alt=media&token=39307aa8-c459-4f66-9e0c-2bf7b68c6c77" alt="Carlos M." width={50} height={50} className="rounded-full mr-4" data-ai-hint="smiling parent child" />
                <div>
                  <h4 className="font-semibold text-foreground">Carlos M.</h4>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />)}
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground italic">"A mi hijo le encanta votar por sus panoramas. Siente que su opinión importa y espera con más ganas el fin de semana. Siento que nos ha unido más."</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
