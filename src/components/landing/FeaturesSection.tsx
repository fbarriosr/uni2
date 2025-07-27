
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThumbsUp, Users, Star, Smile } from 'lucide-react';

export default function FeaturesSection() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-headline text-primary text-center mb-16">
          Una Herramienta para la Conexión Emocional
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
            <CardHeader className="items-center text-center">
              <div className="p-4 bg-primary rounded-full mb-4 inline-block shadow-md">
                <Smile size={36} className="text-primary-foreground" />
              </div>
              <CardTitle className="text-xl font-headline text-foreground">Co-creación Simple</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              Olvídense de las discusiones. Padre e hijo proponen y votan por actividades. ¡Si hay coincidencia, tienen un plan que ambos disfrutan!
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
            <CardHeader className="items-center text-center">
               <div className="p-4 bg-primary rounded-full mb-4 inline-block shadow-md">
                 <Users size={36} className="text-primary-foreground" />
              </div>
              <CardTitle className="text-xl font-headline text-foreground">Vínculo Reforzado</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
             Fomenta la comunicación y el trabajo en equipo. Elegir juntos fortalece el lazo afectivo y crea una complicidad única.
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
            <CardHeader className="items-center text-center">
               <div className="p-4 bg-primary rounded-full mb-4 inline-block shadow-md">
                  <Star size={36} className="text-primary-foreground" />
               </div>
              <CardTitle className="text-xl font-headline text-foreground">Recuerdos Valiosos</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              Cada salida es una historia que construyen juntos. Guarda fotos y anécdotas de cada aventura para revivirlas y atesorarlas.
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
