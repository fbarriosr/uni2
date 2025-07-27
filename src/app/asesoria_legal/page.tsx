
import AuthCheck from '@/components/AuthCheck';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Gavel, Users, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { Suspense } from 'react';
import { getLegalExperts } from '@/lib/data';
import type { Expert } from '@/lib/types';
import Link from 'next/link';
import { AppRoutes } from '@/lib/urls';

// --- Reusable Components for this Page ---

const SectionCard = ({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) => (
    <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center gap-3">
            <Icon className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-headline text-primary">
                {title}
            </CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
    </Card>
);

const PlaceholderCard = () => (
    <Card className="h-40 flex items-center justify-center bg-muted/50 border-dashed">
        <p className="text-muted-foreground">Contenido Próximamente</p>
    </Card>
);

const LegalExpertCard = ({ expert }: { expert: Expert }) => (
    <Link href={AppRoutes.asesoriaLegalExpertDetail(expert.id)} className="block group">
        <Card className="p-4 text-center h-full flex flex-col justify-between hover:shadow-xl hover:border-primary/50 transition-all duration-300 ease-in-out transform hover:-translate-y-1">
            <div>
                <Image 
                    src={expert.photo || 'https://placehold.co/256x256.png'} 
                    alt={expert.name} 
                    width={96} 
                    height={96} 
                    className="w-24 h-24 rounded-full mx-auto object-cover mb-4 shadow-lg ring-2 ring-primary/20"
                    data-ai-hint="lawyer portrait"
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


async function AcademiaLegalContent() {
    // In a real scenario, you would fetch data for articles, laws, and experts here.
    const legalExperts = await getLegalExperts();

    return (
        <div className="space-y-12">
            <header className="relative w-full h-80 flex items-center justify-center text-center text-white overflow-hidden">
                <Image
                    src="https://firebasestorage.googleapis.com/v0/b/lemon-admin.firebasestorage.app/o/legal%2Flegal.jpg?alt=media&token=42a196d1-79e1-4ead-a728-af3282a3d4a9"
                    alt="Orientación Legal"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative z-10 p-4">
                    <h1 className="text-4xl md:text-5xl font-headline">Orientación Legal</h1>
                    <p className="text-lg text-white/90 mt-2 max-w-2xl mx-auto">Derechos y deberes familiares, respondemos tus dudas.</p>
                </div>
            </header>

            <div className="container mx-auto py-8 space-y-12">
                <SectionCard title="Artículos" icon={FileText}>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Placeholder for Articles */}
                        <PlaceholderCard />
                        <PlaceholderCard />
                        <PlaceholderCard />
                    </div>
                </SectionCard>

                <SectionCard title="Leyes Vigentes" icon={Gavel}>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Placeholder for Laws */}
                        <PlaceholderCard />
                        <PlaceholderCard />
                        <PlaceholderCard />
                    </div>
                </SectionCard>
                
                <SectionCard title="Red de Asesores Expertos" icon={Users}>
                    {legalExperts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {legalExperts.map(expert => (
                                <LegalExpertCard key={expert.id} expert={expert} />
                            ))}
                        </div>
                    ) : (
                         <div className="text-center text-muted-foreground py-10">
                            <p>Actualmente no hay asesores expertos disponibles.</p>
                        </div>
                    )}
                </SectionCard>
            </div>
        </div>
    );
}

export default function AsesoriaLegalPage() {
    return (
        <AuthCheck>
            <Suspense fallback={<div className="container mx-auto text-center py-20">Cargando...</div>}>
                <AcademiaLegalContent />
            </Suspense>
        </AuthCheck>
    );
}
