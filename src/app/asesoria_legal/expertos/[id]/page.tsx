
import AuthCheck from '@/components/AuthCheck';
import { getLegalExpertById } from '@/lib/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Clock, Globe, Quote, BrainCircuit, Gavel, FileText, ArrowRight } from 'lucide-react';
import { Suspense } from 'react';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Metadata } from 'next';

type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const expert = await getLegalExpertById(params.id);
  if (!expert) {
    return { title: 'Experto no encontrado' };
  }
  return {
    title: `Asesor Legal: ${expert.name}`,
    description: `Información sobre el asesor legal ${expert.name}, especialista en ${expert.specialty}.`,
  };
}

// A loading component to show while the page is being prepared
function LegalExpertDetailPageLoading() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-5xl">
            <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
                <div className="w-48 h-48 rounded-full bg-muted animate-pulse"></div>
                <div className="flex-1 text-center md:text-left">
                    <div className="h-10 w-3/4 bg-muted rounded-md mb-3 animate-pulse"></div>
                    <div className="h-6 w-1/2 bg-muted rounded-md animate-pulse"></div>
                </div>
            </div>
            <Card className="w-full shadow-lg">
                <CardContent className="p-8 grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-1 space-y-6">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                    <div className="md:col-span-2 space-y-6">
                       <div className="h-8 w-1/4 bg-muted rounded-md animate-pulse"></div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full bg-muted rounded-md animate-pulse" />
                            <Skeleton className="h-4 w-5/6 bg-muted rounded-md animate-pulse" />
                        </div>
                        <div className="h-8 w-1/4 bg-muted rounded-md animate-pulse"></div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full bg-muted rounded-md animate-pulse" />
                            <Skeleton className="h-4 w-4/6 bg-muted rounded-md animate-pulse" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Reusable component for displaying a detail item in the main content area
const InfoSection = ({ icon: Icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) => (
    <div>
        <h3 className="text-xl font-headline flex items-center gap-3 text-foreground mb-3">
            <Icon className="h-6 w-6 text-primary" />
            {title}
        </h3>
        <div className="text-muted-foreground prose prose-sm max-w-none">
            {children}
        </div>
    </div>
);

const QuoteItem = ({ text, author }: { text: string; author?: string }) => (
  <blockquote className="pl-4 border-l-4 border-primary/50 bg-muted/50 p-4 rounded-r-lg">
    <p className="italic text-foreground">“{text}”</p>
    {author && <footer className="text-xs text-muted-foreground mt-2">— {author}</footer>}
  </blockquote>
);


async function LegalExpertDetailContent({ expertId }: { expertId: string }) {
    const expert = await getLegalExpertById(expertId);

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
                    className="w-48 h-48 rounded-full object-cover shadow-2xl border-4 border-primary/50 flex-shrink-0"
                    data-ai-hint="expert lawyer portrait"
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

                {/* Left Column for Contact Info */}
                <div className="lg:col-span-1 space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Información de Contacto</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            {expert.lugar_de_trabajo && (
                                <div className="flex items-start">
                                    <Briefcase className="h-5 w-5 mr-3 mt-1 text-primary shrink-0"/>
                                    <div>
                                        <p className="font-semibold">Estudio Jurídico</p>
                                        <p className="text-muted-foreground">{expert.lugar_de_trabajo}</p>
                                    </div>
                                </div>
                            )}
                             {expert.horario && (
                                <div className="flex items-start">
                                    <Clock className="h-5 w-5 mr-3 mt-1 text-primary shrink-0"/>
                                     <div>
                                        <p className="font-semibold">Horario de Consulta</p>
                                        <p className="text-muted-foreground">{expert.horario}</p>
                                    </div>
                                </div>
                            )}
                            {expert.sitio_web && (
                                <div className="flex items-start">
                                    <Globe className="h-5 w-5 mr-3 mt-1 text-primary shrink-0"/>
                                     <div>
                                        <p className="font-semibold">Sitio Web / Perfil</p>
                                        <a href={expert.sitio_web} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                                            {expert.sitio_web}
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
                                <InfoSection icon={FileText} title="Biografía">
                                    <p>{expert.descripcion}</p>
                                </InfoSection>
                            )}

                             {expert.areas_de_practica && (
                                <InfoSection icon={Gavel} title="Áreas de Práctica">
                                    <ul className="list-disc list-inside space-y-1">
                                        {Array.isArray(expert.areas_de_practica) 
                                            ? expert.areas_de_practica.map((area, i) => <li key={i}>{area}</li>) 
                                            : <li>{expert.areas_de_practica}</li>
                                        }
                                    </ul>
                                </InfoSection>
                            )}
                            
                            {expert.comentarios_padres && expert.comentarios_padres.length > 0 && (
                                <InfoSection icon={Quote} title="Comentarios de Clientes">
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

export default function LegalExpertDetailPage({ params }: { params: { id: string } }) {
    return (
        <AuthCheck>
            <Suspense fallback={<LegalExpertDetailPageLoading />}>
                <LegalExpertDetailContent expertId={params.id} />
            </Suspense>
        </AuthCheck>
    );
}
