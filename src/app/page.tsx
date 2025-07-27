
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Smile, Heart, Star } from 'lucide-react'; // Example icons

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen"> {/* Use min-h-screen for full height */}
      {/* Hero Section / Banner */}
      <section
        className="relative w-full h-[calc(100vh-4rem)] flex items-center justify-center text-center bg-cover bg-center"
        style={{
          backgroundImage: `url('https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/home%2Fhome1.jpg?alt=media&token=93246ffe-b131-446f-a62e-68c83c8d17c4')`,
        }}
      >
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-black opacity-50"></div>
        
        {/* Content */}
        <div className="relative z-10 text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            UNI2: Fines de semana que fortalecen vínculos
          </h1>
          <p className="text-lg md:text-xl mb-8">
            Sabemos que la falta de tiempo y herramientas puede deteriorar silenciosamente el vínculo. UNI2 convierte la planificación de actividades en una oportunidad para conectar, reforzar el apego y construir recuerdos valiosos.
          </p>
          <Link href="/login" passHref>
            <Button size="lg" className="text-lg px-8 py-6">
              Empezar a Crear Recuerdos
            </Button>
          </Link>
        </div>
      </section>

      {/* "Una Herramienta para la Conexión Emocional" Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-foreground">Una Herramienta para la Conexión Emocional</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Co-creación Simple */}
            <Card className="flex flex-col items-center text-center p-6">
              <div className="bg-blue-100 rounded-full p-4 mb-4">
                <Smile className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Co-creación Simple</h3>
              <p className="text-muted-foreground">Olvídense de las discusiones. Padre e hijo proponen y votan por actividades. ¡Si hay coincidencia, tienen un plan que ambos disfrutan!</p>
            </Card>
            
            {/* Card 2: Vínculo Reforzado */}
            <Card className="flex flex-col items-center text-center p-6">
              <div className="bg-green-100 rounded-full p-4 mb-4">
                <Heart className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Vínculo Reforzado</h3>
              <p className="text-muted-foreground">Fomenta la comunicación y el trabajo en equipo. Elegir juntos fortalece el lazo afectivo y crea una complicidad única.</p>
            </Card>

            {/* Card 3: Recuerdos Valiosos */}
            <Card className="flex flex-col items-center text-center p-6">
              <div className="bg-yellow-100 rounded-full p-4 mb-4">
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Recuerdos Valiosos</h3>
              <p className="text-muted-foreground">Cada salida es una historia que construyen juntos. Guarda fotos y anécdotas de cada aventura para revivirlas y atesorarlas.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* "¿Cómo Funciona UNI2?" Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-foreground">¿Cómo Funciona UNI2?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1: Proponen */}
            <Card className="flex flex-col items-center text-center p-6">
              <div className="bg-blue-500 text-white rounded-full h-12 w-12 flex items-center justify-center text-2xl font-bold mb-4">1</div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Proponen</h3>
              <p className="text-muted-foreground">Padre e hijo navegan por las actividades y cada uno selecciona las que más le gustan para la próxima salida.</p>
            </Card>

            {/* Step 2: Eligen */}
            <Card className="flex flex-col items-center text-center p-6">
               <div className="bg-green-500 text-white rounded-full h-12 w-12 flex items-center justify-center text-2xl font-bold mb-4">2</div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Eligen</h3>
              <p className="text-muted-foreground">UNI2 revela las coincidencias. ¡Esas son las actividades finalistas! La decisión final es más fácil y emocionante que nunca.</p>
            </Card>

            {/* Step 3: Conectan */}
            <Card className="flex flex-col items-center text-center p-6">
               <div className="bg-yellow-500 text-white rounded-full h-12 w-12 flex items-center justify-center text-2xl font-bold mb-4">3</div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Conectan</h3>
              <p className="text-muted-foreground">Con un plan que les encanta a los dos, cada fin de semana se convierte en una aventura memorable y un lazo más fuerte.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-foreground">Lo Que Dicen Nuestras Familias</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="text-left">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Image
                    src="https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/home%2Flaura.png?alt=media&token=b590402f-72a2-43ad-bac7-c283a8ded5f9"
                    alt="Laura P."
                    width={50}
                    height={50}
                    className="rounded-full mr-4"
                    data-ai-hint="happy parent portrait"
                  />
                  <div>
                    <h4 className="font-semibold text-foreground">Laura P.</h4>
                    <div className="flex text-yellow-500">
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground italic">"Desde que usamos UNI2, los fines de semana son diferentes. Se acabaron las discusiones sobre qué hacer. Ahora mi hija y yo elegimos juntos y ambos estamos felices."</p>
              </CardContent>
            </Card>
            <Card className="text-left">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                   <Image
                    src="https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/home%2Fcarlos.png?alt=media&token=39307aa8-c459-4f66-9e0c-2bf7b68c6c77"
                    alt="Carlos M."
                    width={50}
                    height={50}
                    className="rounded-full mr-4"
                    data-ai-hint="smiling parent child"
                  />
                  <div>
                    <h4 className="font-semibold text-foreground">Carlos M.</h4>
                    <div className="flex text-yellow-500">
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                      <Star size={16} fill="currentColor" />
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground italic">"A mi hijo le encanta votar por sus panoramas. Siente que su opinión importa y espera con más ganas el fin de semana. Siento que nos ha unido más."</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-headline mb-6">
            Deja de Adivinar. Empiecen a Conectar.
          </h2>
          <p className="text-lg mb-10 max-w-xl mx-auto opacity-90">
            Prueba el sistema de co-creación y descubre una nueva forma de planificar con tus hijos. Menos estrés, más unión.
          </p>
          <Button size="lg" asChild className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg font-semibold py-3 px-8 text-lg">
            <Link href="/login">Empezar a Crear Recuerdos</Link>
          </Button>
        </div>
      </section>

    </div>
  );
}
