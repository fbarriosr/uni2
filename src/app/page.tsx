'use client'; // 👈 Esto resuelve el error
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Smile, Heart, Star } from 'lucide-react'; // Example icons

// Import carousel components
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Image from 'next/image';
import Link from 'next/link';

// Importar plugin Autoplay
import Autoplay from 'embla-carousel-autoplay';

//crea la instancia fuera del componente
const autoplayPlugin = Autoplay({ delay: 5000  });

const images = [
  'https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/home%2Funo.jpg?alt=media&token=84eec251-46c8-47ca-b31f-3eb9886c8af7',
  'https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/home%2Fbanner.jpg?alt=media&token=c72a3498-445f-4efc-b68e-df52660c87a8',
  'https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/home%2Fbanner2.jpg?alt=media&token=c28a5947-7741-4f45-8b7f-e818183b0f0c',
];

const testimonials = [
  {
    quote: "Desde que usamos UNI2, los fines de semana son diferentes. Se acabaron las discusiones sobre qué hacer. Ahora mi hija y yo elegimos juntos y ambos estamos felices.",
    name: "Laura P.",
    image: "https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/home%2Flaura.png?alt=media&token=b590402f-72a2-43ad-bac7-c283a8ded5f9",
  },
  {
    quote: "A mi hijo le encanta votar por sus panoramas. Siente que su opinión importa y espera con más ganas el fin de semana. Siento que nos ha unido más.",
    name: "Carlos M.",
    image: "https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/home%2Fcarlos.png?alt=media&token=39307aa8-c459-4f66-9e0c-2bf7b68c6c77",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen"> { /* Use min-h-screen for full height */}
      {/* Hero Section / Banner - Now a Carousel */}
      <section className="relative w-full h-[calc(100vh-4rem)]">
        <Carousel className="w-full h-full" plugins={[autoplayPlugin]}>
          <CarouselContent>
            {images.map((image, index) => (
              <CarouselItem key={index}>
                <div
                  className="w-full h-[calc(100vh-4rem)] flex items-center justify-center text-center bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${image}')`,
                  }}
                >
                  {/* Overlay for text readability */}
                  <div className="absolute inset-0 bg-black/60"></div>
                  {/* Content */}
                  <div className="relative z-10 text-white px-4 max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                      UNI2: Fines de semana que fortalecen vínculos
                    </h1>
                    <p className="text-lg md:text-xl mb-8">
                      Sabemos que la falta de tiempo y herramientas puede deteriorar silenciosamente el vínculo. UNI2 convierte la planificación de actividades en una oportunidad para conectar, reforzar el apego y construir recuerdos valiosos.
                    </p>
                    <Link href="/inicio" passHref>
                      <Button size="lg">Empezar a crear recuerdos</Button>
                    </Link>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {/* Add these lines for the controls */}
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </section>
      {/* End Hero Section */}

      {/* Herramienta para la Conexión Emocional Section */}
      <section className="py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Una Herramienta para la Conexión Emocional</h2>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-3 lg:gap-12">
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Smile className="h-12 w-12 text-primary" />
                <h3 className="mt-4 text-xl font-bold">Co-creación Simple</h3>
                <p className="mt-2 text-gray-500 text-center dark:text-gray-400">
                  Olvidense de las discusiones. Padre e hijo proponen y votan por actividades. ¡Si hay coincidencia, tienen un plan que ambos disfrutan!
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Heart className="h-12 w-12 text-primary" />
                <h3 className="mt-4 text-xl font-bold">Vínculo Reforzado</h3>
                <p className="mt-2 text-gray-500 text-center dark:text-gray-400">
                  Fomenta la comunicación y el trabajo en equipo. Elegir juntos fortalece el lazo afectivo y crea una complicidad única.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Star className="h-12 w-12 text-primary" />
                <h3 className="mt-4 text-xl font-bold">Recuerdos Valiosos</h3>
                <p className="mt-2 text-gray-500 text-center dark:text-gray-400">
                  Cada salida es una historia que construyen juntos. Guarda fotos y anécdotas de cada aventura para revivirlas y atesorarlas.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      {/* End Herramienta para la Conexión Emocional Section */}

      {/* How it Works Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
        <div className="container px-4 md:px-6 text-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">¿Cómo Funciona UNI2?</h2>
            <p className="max-w-[900px] mx-auto text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              UNI2 simplifica la planificación de actividades en 3 sencillos pasos.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="flex flex-col items-center text-center p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 text-white text-2xl font-bold mb-4">1</div>
              <h3 className="text-xl font-bold">Proponen</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Padre e hijo navegan por las actividades y cada uno selecciona las que más le gustan para la próxima salida.
              </p>
            </Card>
            <Card className="flex flex-col items-center text-center p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500 text-white text-2xl font-bold mb-4">2</div>
              <h3 className="text-xl font-bold">Eligen</h3>
              <p className="text-gray-500 dark:text-gray-400">
                UNI2 revela las coincidencias. ¡Esas son las actividades finalistas! La decisión final es más fácil y emocionante que nunca.
              </p>
            </Card>
            <Card className="flex flex-col items-center text-center p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500 text-white text-2xl font-bold mb-4">3</div>
              <h3 className="text-xl font-bold">Conectan</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Con un plan que les encanta a los dos, cada fin de semana se convierte en una aventura memorable y un lazo más fuerte.
              </p>
            </Card>
          </div>
        </div>
      </section>
      {/* End How it Works Section */}

      {/* Testimonials Section */}
      <section className="py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6 text-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Lo Que Dicen Nuestras Familias</h2>
            <p className="max-w-[900px] mx-auto text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Escucha lo que otras familias dicen sobre UNI2.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-2 lg:gap-12">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                  <Image 
                    src={testimonial.image} 
                    alt={`Photo of ${testimonial.name}`} 
                    width={80} 
                    height={80} 
                    className="rounded-full object-cover mb-4"
                  />
                  <p className="mt-2 text-gray-700 italic dark:text-gray-300">
                    "{testimonial.quote}"
                  </p>
                  <h3 className="mt-4 text-xl font-bold">{testimonial.name}</h3>
                  {/* Add star rating here if desired */}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* End Testimonials Section */}

      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
        <div className="container px-4 md:px-6 text-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Listo para Fortalecer Vínculos?</h2>
            <p className="max-w-[900px] mx-auto text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Únete a UNI2 hoy mismo y empieza a crear momentos inolvidables.
            </p>
            <Button size="lg">Empieza Ahora</Button>
          </div>
        </div>
      </section>

    </div>
  );
}
