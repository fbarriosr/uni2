
import AuthCheck from '@/components/AuthCheck';
import { getExpertById } from '@/lib/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Clock, Globe, Quote, BrainCircuit, User, Pencil, ArrowRight } from 'lucide-react';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// A loading component to show while the page is being prepared
function ExpertDetailPageLoading() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-5xl">
            <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
                <div className="w-48 h-48 rounded-full bg-muted animate-pulse"></div>
                <div className="flex-1 text-center md:text-left">
                    <div className="h-10 w-3/4 bg-muted rounded-md mb-3 animate-pulse"></div>
                    <div className="h-6 w-1/2 bg-muted rounded-md animate-pulse"></div>
                    <div className="h-10 w-48 bg-muted rounded-md mt-4 animate-pulse"></div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                 <div className="lg:col-span-1 space-y-6">
                    <div className="h-40 w-full bg-muted rounded-lg animate-pulse"></div>
                    <div className="h-32 w-full bg-muted rounded-lg animate-pulse"></div>
                 </div>
                 <div className="lg:col-span-2">
                    <div className="h-80 w-full bg-muted rounded-lg animate-pulse"></div>
                 </div>
            </div>
        </div>
    );
}

// Reusable component for displaying an info section
const InfoSection = ({ icon: Icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) => (
    <div>
        <h3 className="text-xl font-headline flex items-center gap-3 text-foreground mb-3">
            <Icon className="h-6 w-6 text-primary" />
            {title}
        </h3>
        <div className="text-muted-foreground prose prose-sm max-w-none pl-9">
            {children}
        </div>
    </div>
);

// Reusable component for quotes or comments
const QuoteItem = ({ text, author }: { text: string; author?: string }) => (
  <blockquote className="pl-4 border-l-4 border-primary/50 bg-muted/50 p-4 rounded-r-lg">
    <p className="italic text-foreground">“{text}”</p>
    {author && <footer className="text-xs text-muted-foreground mt-2">— {author}</footer>}
  </blockquote>
);


async function ExpertDetailContent({ expertId }: { expertId: string }) {
    const expert = await getExpertById(expertId);

    if (!expert) {
        notFound();
    }

    return (
        <div className="container mx-auto py-12 px-4 max-w-5xl">
            <header className="flex flex-col md:flex-row items-center gap-8 mb-10 text-center md:text-left">
                <Image
                    src={expert.photo || 'https://placehold.co/256x256.png'}
                    alt={expert.name}
                    width={192}
                    height={192}
                    className="w-48 h-48 rounded-full object-cover shadow-2xl border-4 border-primary flex-shrink-0"
                    data-ai-hint="expert portrait"
                    priority
                />
                <div className="flex-1">
                    <h1 className="text-4xl font-headline text-foreground">{expert.name}</h1>
                    <p className="text-xl text-primary font-medium mt-1">{expert.specialty}</p>
                    {expert.sitio_web && (
                        <Button asChild className="mt-4 shadow-md hover:shadow-lg transition-shadow">
                            <Link href={expert.sitio_web} target="_blank" rel="noopener noreferrer">
                                Contactar o Reservar Hora <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* Left Column for Contact & AI */}
                <div id="contacto" className="lg:col-span-1 space-y-6 scroll-mt-24">
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Información de Contacto</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            {expert.lugar_de_trabajo && (
                                <div className="flex items-start">
                                    <Briefcase className="h-5 w-5 mr-3 mt-1 text-primary shrink-0"/>
                                    <div>
                                        <p className="font-semibold">Lugar de Trabajo</p>
                                        <p className="text-muted-foreground">{expert.lugar_de_trabajo}</p>
                                    </div>
                                </div>
                            )}
                             {expert.horario && (
                                <div className="flex items-start">
                                    <Clock className="h-5 w-5 mr-3 mt-1 text-primary shrink-0"/>
                                     <div>
                                        <p className="font-semibold">Horario</p>
                                        <p className="text-muted-foreground">{expert.horario}</p>
                                    </div>
                                </div>
                            )}
                            {expert.sitio_web && (
                                <div className="flex items-start">
                                    <Globe className="h-5 w-5 mr-3 mt-1 text-primary shrink-0"/>
                                     <div>
                                        <p className="font-semibold">Sitio Web</p>
                                        <a href={expert.sitio_web} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                                            Visitar sitio
                                        </a>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    {expert.comentario_ia && (
                         <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2"><BrainCircuit className="h-5 w-5" />Resumen IA</CardTitle>
                            </CardHeader>
                            <CardContent>
                               <QuoteItem text={expert.comentario_ia} />
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column for Details */}
                <div className="lg:col-span-2">
                    <Card className="shadow-lg">
                        <CardContent className="p-8 space-y-8">
                             {expert.descripcion && (
                                <InfoSection icon={Pencil} title="Biografía">
                                    <p>{expert.descripcion}</p>
                                </InfoSection>
                            )}

                             {expert.trayectoria && (
                                <InfoSection icon={User} title="Trayectoria">
                                    <p>{expert.trayectoria}</p>
                                </InfoSection>
                            )}
                            
                            {expert.comentarios_padres && expert.comentarios_padres.length > 0 && (
                                <InfoSection icon={Quote} title="Comentarios de Padres">
                                    <div className="space-y-4">
                                        {expert.comentarios_padres.map((comment, index) => (
                                            <QuoteItem key={index} text={comment} />
                                        ))}
                                    </div>
                                </InfoSection>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function ExpertDetailPage({ params }: { params: { id: string } }) {
    return (
        <AuthCheck>
            <Suspense fallback={<ExpertDetailPageLoading />}>
                <ExpertDetailContent expertId={params.id} />
            </Suspense>
        </AuthCheck>
    );
}
