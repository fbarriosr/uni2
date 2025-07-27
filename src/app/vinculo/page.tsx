
import AuthCheck from '@/components/AuthCheck';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Trophy, FileText, Star, BookMarked, ShieldQuestion, ArrowRight, GraduationCap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
    getActiveLearningPaths,
    getActiveMicroLessons,
    getActiveChallenges,
    getActiveArticles,
    getExperts,
    getActiveSuggestedReadings,
} from '@/lib/data';
import { Suspense } from 'react';
import { AppRoutes } from '@/lib/urls';
import { cn } from '@/lib/utils';

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

const LearningPathCard = ({ path }: { path: any }) => (
    <Card className="overflow-hidden group">
        <Image src={path.coverImage} alt={path.title} width={400} height={200} className="w-full h-32 object-cover" />
        <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-2">{path.title}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Progress value={25} className="w-full h-2" />
                <span>25%</span>
            </div>
        </CardContent>
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

const ArticleCard = ({ article }: { article: any }) => (
     <Card className="relative overflow-hidden group h-48 flex items-end p-4">
        <Image src={article.coverImage} alt={article.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <h3 className="relative z-10 font-bold text-lg text-white">{article.title}</h3>
    </Card>
);

const ExpertCard = ({ expert }: { expert: any }) => (
    <Link href={AppRoutes.vinculoExpertDetail(expert.id)} className="block group">
        <Card className="p-4 text-center h-full flex flex-col justify-between hover:shadow-xl hover:border-primary/50 transition-all duration-300 ease-in-out transform hover:-translate-y-1">
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
                    <p className="text-xs text-muted-foreground italic px-2 mt-1 mb-3">
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


const ReadingCard = ({ reading }: { reading: any }) => (
     <Card className="overflow-hidden group">
        <Image src={reading.coverImage} alt={reading.title} width={200} height={300} className="w-full h-48 object-cover" />
        <div className="p-3">
            <h3 className="font-semibold text-md truncate">{reading.title}</h3>
            <p className="text-xs text-muted-foreground truncate">{reading.subtitle}</p>
        </div>
    </Card>
);


async function AcademiaVinculoContent() {
    const [
        learningPaths,
        microLessons,
        challenges,
        articles,
        experts,
        suggestedReadings,
    ] = await Promise.all([
        getActiveLearningPaths(),
        getActiveMicroLessons(),
        getActiveChallenges(),
        getActiveArticles(),
        getExperts(),
        getActiveSuggestedReadings(),
    ]);

    const weeklyChallenges = challenges.filter(c => c.period === 'weekly');
    const monthlyChallenges = challenges.filter(c => c.period === 'monthly');

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
                <SectionCard title="Rutas de Aprendizaje" icon={GraduationCap}>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {learningPaths.map(path => <LearningPathCard key={path.id} path={path} />)}
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

                <SectionCard title="Artículos y Recursos" icon={FileText}>
                     <div className="grid md:grid-cols-2 gap-6">
                        {articles.map(article => <ArticleCard key={article.id} article={article} />)}
                    </div>
                </SectionCard>

                <SectionCard title="Red de Expertos Uni2" icon={Star}>
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {experts.map(expert => <ExpertCard key={expert.id} expert={expert} />)}
                     </div>
                </SectionCard>

                 <SectionCard title="Lecturas Sugeridas" icon={BookMarked}>
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {suggestedReadings.map(reading => <ReadingCard key={reading.id} reading={reading} />)}
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
