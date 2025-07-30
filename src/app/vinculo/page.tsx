
import AuthCheck from '@/components/AuthCheck';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Trophy, FileText, Star, BookMarked, ShieldQuestion, ArrowRight, GraduationCap, Lightbulb, Link as LinkIcon, BrainCircuit } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
    getActiveMicroLessons,
    getActiveChallenges,
    getActiveArticles,
    getExperts,
} from '@/lib/data';
import { Suspense } from 'react';
import { AppRoutes } from '@/lib/urls';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

// --- Reusable Components for this Page ---

const SectionCard = ({ title, icon: Icon, children, href }: { title: string, icon: React.ElementType, children: React.ReactNode, href?: string }) => (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl font-headline text-primary flex items-center gap-3">
                <Icon className="h-7 w-7" />
                {title}
            </CardTitle>
            {href && (
                <Button variant="link" asChild>
                    <Link href={href}>Ver todo <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            )}
        </CardHeader>
        <CardContent>{children}</CardContent>
    </Card>
);

const MicroLessonCard = ({ lesson }: { lesson: any }) => (
    <Card className="overflow-hidden group text-center">
        <Image src={lesson.image} alt={lesson.title} width={300} height={300} className="w-full aspect-square object-cover" />
        <div className="p-3">
            <h3 className="font-semibold text-md truncate">{lesson.title}</h3>
            <p className="text-xs text-muted-foreground truncate">{lesson.description}</p>
        </div>
    </Card>
);

const ChallengeCard = ({ challenge }: { challenge: any }) => (
    <Card className="relative overflow-hidden group h-40 flex items-end p-4">
        <Image src={challenge.image} alt={challenge.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <h3 className="relative z-10 font-bold text-lg text-white">{challenge.title}</h3>
    </Card>
);

const ExpertCard = ({ expert }: { expert: any }) => (
    <Link
  href={AppRoutes.vinculoExpertDetail(expert.id)}
  className="block group w-full max-w-sm mx-auto h-full"
>
  <Card
    className="w-full h-full p-4 text-center flex flex-col justify-between hover:shadow-xl hover:border-primary/50 transition-all duration-300 ease-in-out transform hover:-translate-y-1"
  >
    <div>
      <Image 
        src={expert.photo || 'https://placehold.co/256x256.png'} 
        alt={expert.name} 
        width={96} 
        height={96} 
        className="w-24 h-24 rounded-full mx-auto object-cover mb-4 shadow-lg ring-2 ring-primary/20"
        data-ai-hint="expert portrait"
      />
      <h3 className="font-bold text-lg text-foreground group-hover:text-primary">{expert.name}</h3>
      <p className="text-sm font-medium text-primary mb-2">{expert.specialty}</p>
      {expert.comentario_ia && (
        <p className="text-xs text-muted-foreground italic px-2 mt-1 mb-3 line-clamp-3">
          "{expert.comentario_ia}"
        </p>
      )}
    </div>
    {expert.lugar_de_trabajo && (
      <div className="mt-auto pt-3 border-t border-dashed w-full">
        <p className="text-xs text-muted-foreground">{expert.lugar_de_trabajo}</p>
      </div>
    )}
  </Card>
</Link>

);

// --- New Suggested Reading Card Component ---
const DetailedReadingCard = ({ reading }: { reading: { emoji: string, title: string, description: string, link: string, whyRead: string[] } }) => (
  <Card className="flex flex-col h-full">
    <CardHeader>
      <CardTitle className="text-xl font-headline text-foreground">
        <span className="mr-3">{reading.emoji}</span>
        {reading.title}
      </CardTitle>
    </CardHeader>
    <CardContent className="flex-grow space-y-4">
      <p className="text-sm text-muted-foreground">{reading.description}</p>
      
      <div className="p-4 bg-primary/5 rounded-lg border-l-4 border-primary/50">
        <h4 className="font-semibold text-sm text-primary mb-2 flex items-center gap-2">
            <Lightbulb size={16}/>
            ¿Por qué leerlo?
        </h4>
        <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
            {reading.whyRead.map((point, i) => (
                <li key={i}>{point}</li>
            ))}
        </ul>
      </div>
    </CardContent>
    <CardFooter>
        <Button asChild className="w-full">
            <a href={reading.link} target="_blank" rel="noopener noreferrer">
                <LinkIcon className="mr-2 h-4 w-4"/>
                Ver Recurso
            </a>
        </Button>
    </CardFooter>
  </Card>
);

const DetailedArticleCard = ({ article }: { article: { emoji: string, title: string, description: string, link: string, relevance: string[], expertComment: string } }) => (
    <Card className="flex flex-col h-full">
        <CardHeader>
            <CardTitle className="text-xl font-headline text-foreground">
                <span className="mr-3">{article.emoji}</span>
                {article.title}
            </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
            <p className="text-sm text-muted-foreground">{article.description}</p>
            
            <div className="p-4 bg-primary/5 rounded-lg border-l-4 border-primary/50">
                <h4 className="font-semibold text-sm text-primary mb-2 flex items-center gap-2">
                    <BrainCircuit size={16}/>
                    ¿Por qué es relevante?
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                    {article.relevance.map((point, i) => (
                        <li key={i}>{point}</li>
                    ))}
                </ul>
            </div>
             <blockquote className="mt-6 border-l-2 pl-6 italic text-sm text-muted-foreground">
                {article.expertComment}
            </blockquote>
        </CardContent>
        <CardFooter>
            <Button asChild className="w-full">
                <a href={article.link} target="_blank" rel="noopener noreferrer">
                    <LinkIcon className="mr-2 h-4 w-4"/>
                    Leer Artículo
                </a>
            </Button>
        </CardFooter>
    </Card>
);


async function AcademiaVinculoContent() {
    const [
        microLessons,
        challenges,
        experts,
    ] = await Promise.all([
        getActiveMicroLessons(),
        getActiveChallenges(),
        getExperts(),
    ]);

    const weeklyChallenges = challenges.filter(c => c.period === 'weekly');
    const monthlyChallenges = challenges.filter(c => c.period === 'monthly');

    const suggestedReadingsData = [
        {
            emoji: '📘',
            title: 'Cuando los padres se separan – Guía práctica para una separación consciente',
            description: 'Una guía directa y sencilla que ayuda a los padres a comprender y acompañar emocionalmente a sus hijos durante el proceso de separación. Aporta estrategias prácticas para mantener la estabilidad afectiva, disminuir la culpa y fortalecer el vínculo desde la empatía.',
            link: 'https://libroasupuerta.cl/catalogo/cuando-los-padres-se-separan',
            whyRead: [
                'Enseña cómo comunicar la separación de forma adecuada a los hijos.',
                'Aporta recursos para manejar la culpa y el conflicto.',
                'Favorece la construcción de un vínculo seguro tras la separación.'
            ]
        },
        {
            emoji: '📗',
            title: 'Hijos frente a la separación de sus padres – Manual del ICEPH',
            description: 'Manual desarrollado por el Instituto Chileno de Estudios de la Pareja y la Familia (ICEPH), con un enfoque psicodinámico y sistémico. Profundiza en cómo afecta la separación a los niños en distintas etapas evolutivas y entrega recomendaciones prácticas para proteger su salud mental.',
            link: 'https://www.iceph.cl/wp-content/uploads/2021/11/Manual-Hijos-frente-a-la-separacion.pdf',
            whyRead: [
                'Describe reacciones comunes de los niños ante la separación.',
                'Incluye sugerencias para manejar la convivencia entre ambos hogares.',
                'Favorece el rol activo del padre en la contención emocional del menor.'
            ]
        },
        {
            emoji: '📙',
            title: 'Ser padres después de la separación – Artículo de BioBioChile',
            description: 'Artículo de divulgación que recoge las recomendaciones del psicólogo Christian Martínez para establecer una parentalidad efectiva tras la ruptura. Incluye consejos sobre comunicación, límites, afecto y coherencia entre ambos hogares, con lenguaje accesible.',
            link: 'https://www.biobiochile.cl/noticias/vida-actual/consejos/2025/03/17/ser-padres-despues-de-la-separacion-experto-entrega-puntos-claves-para-lograr-una-crianza-saludable.shtml',
            whyRead: [
                'Cómo estructurar rutinas y acuerdos claros entre ambos padres.',
                'Manejo de conflictos para no afectar emocionalmente a los hijos.',
                'La importancia del rol paterno activo, afectivo y coherente.'
            ]
        }
    ];
    
    const detailedArticlesData = [
      {
        emoji: '🧠',
        title: 'Cómo acompañar emocionalmente a los hijos tras la separación',
        description: 'Este artículo profundiza en las reacciones emocionales típicas de los niños frente a la separación y ofrece herramientas para acompañarlos desde la empatía, la contención y la validación emocional.',
        link: 'https://psicologosybienestar.cl/impacto-psicologico-y-emocional-de-la-separacion-de-los-padres-en-ninos/',
        relevance: [
          'Explica el proceso de duelo infantil.',
          'Advierte sobre señales de angustia, culpa o retraimiento.',
          'Recomienda estrategias de regulación emocional y rutinas estables.',
        ],
        expertComment: 'Desde la psicología familiar, este artículo es fundamental para padres que quieren evitar el sufrimiento silencioso de sus hijos y transformar la separación en una experiencia de resiliencia y apego seguro.',
      },
      {
        emoji: '👨‍⚕️',
        title: 'La importancia del rol paterno tras la ruptura conyugal',
        description: 'Aunque redactado por un estudio jurídico, este artículo recoge recomendaciones con sustento psicoeducativo para reforzar el vínculo padre-hijo después de una separación, respetando los tiempos emocionales del niño.',
        link: 'https://www.aguilaycia.cl/post/derechos-del-padre-en-la-relaci%C3%B3n-directa-y-regular',
        relevance: [
          'El rol del padre como figura de seguridad emocional.',
          'La importancia de la relación directa y regular no solo como derecho, sino como necesidad afectiva del menor.',
          'La coordinación con la madre como factor protector para la salud mental del niño.',
        ],
        expertComment: 'Desde la mirada psicológica, el artículo refuerza el mensaje clave: el padre separado no es “padre visitante”, sino una figura emocionalmente activa y significativa.',
      },
      {
        emoji: '🧩',
        title: 'Cuidado compartido y bienestar emocional infantil',
        description: 'Artículo académico que recoge experiencias de padres que ejercen cuidado compartido en Chile. Analiza cómo este modelo no solo promueve la equidad parental, sino también una mejor adaptación emocional de los hijos.',
        link: 'https://tscuadernosdetrabajosocial.cl/index.php/TS/issue/download/numero-28/dinamica-cuidado-chile',
        relevance: [
          'Testimonios reales desde el punto de vista paterno.',
          'Impacto en la autoestima, regulación emocional y estabilidad de los niños.',
          'Factores protectores: comunicación respetuosa entre padres, coherencia de normas y continuidad afectiva.',
        ],
        expertComment: 'Este texto es ideal para padres que desean reflexionar sobre la estructura emocional que brinda la corresponsabilidad real, más allá de los acuerdos legales.',
      },
    ];

    return (
        <div className="space-y-12">
            <header className="relative w-full h-64 flex items-center justify-center text-center text-white overflow-hidden">
                <Image
                    src="https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/vinculo%2Fvinculo.jpg?alt=media&token=5da1749d-2b9d-4644-bb16-79125d8e2654"
                    alt="Academia del Vínculo"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="relative z-10 p-4">
                    <h1 className="text-4xl md:text-5xl font-headline">Academia del Vínculo</h1>
                    <p className="text-lg text-white/90 mt-2 max-w-2xl mx-auto">Herramientas y recursos para fortalecer la conexión con tus hijos.</p>
                </div>
            </header>

            <div className="container mx-auto py-8 space-y-12">
                <SectionCard title="Lecturas Sugeridas" icon={BookMarked}>
                     <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {suggestedReadingsData.map((reading, index) => <DetailedReadingCard key={index} reading={reading} />)}
                    </div>
                </SectionCard>
                
                 <SectionCard title="Artículos y Recursos" icon={FileText}>
                     <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {detailedArticlesData.map((article, index) => (
                           <DetailedArticleCard key={index} article={article} />
                        ))}
                    </div>
                </SectionCard>

                <SectionCard title="Micro-Lecciones" icon={BookOpen}>
                     <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {microLessons.map(lesson => <MicroLessonCard key={lesson.id} lesson={lesson} />)}
                    </div>
                </SectionCard>

                <SectionCard title="Desafíos" icon={Trophy}>
                     <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-3">Semanales</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {weeklyChallenges.map(challenge => <ChallengeCard key={challenge.id} challenge={challenge} />)}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-3">Mensuales</h3>
                             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {monthlyChallenges.map(challenge => <ChallengeCard key={challenge.id} challenge={challenge} />)}
                            </div>
                        </div>
                     </div>
                </SectionCard>

                <SectionCard title="Red de Expertos Uni2" icon={Star}>
                     <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {experts.map(expert => <ExpertCard key={expert.id} expert={expert} />)}
                     </div>
                </SectionCard>

                <div className="relative rounded-lg overflow-hidden p-8 flex items-center bg-card shadow-lg border h-64">
                    <Image src="https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/legal%2Flegal.jpg?alt=media&token=42a196d1-79e1-4ead-a728-af3282a3d4a9" alt="Orientación Legal" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="relative z-10 text-white max-w-xl">
                        <ShieldQuestion className="h-12 w-12 text-blue-300 mb-4" />
                        <h2 className="text-3xl font-bold">Orientación Legal</h2>
                        <p className="text-lg mt-2 mb-4 text-white/90">Derechos y deberes familiares, respondemos tus dudas.</p>
                        <Button asChild variant="secondary">
                            <Link href={AppRoutes.asesoriaLegal}>Acceder al contenido</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}


export default function VinculoPage() {
    return (
        <AuthCheck>
            <Suspense fallback={<div className="container mx-auto text-center py-20">Cargando Academia...</div>}>
                <AcademiaVinculoContent />
            </Suspense>
        </AuthCheck>
    );
}

    