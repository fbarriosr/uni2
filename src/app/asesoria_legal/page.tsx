
import AuthCheck from '@/components/AuthCheck';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Gavel, Users, ArrowRight, BookOpen, Link as LinkIcon, Scale, Shield, Landmark as LandmarkIcon, Globe2, AlertTriangle, Users2 } from 'lucide-react';
import Image from 'next/image';
import { Suspense } from 'react';
import { getLegalExperts } from '@/lib/data';
import type { Expert } from '@/lib/types';
import Link from 'next/link';
import { AppRoutes } from '@/lib/urls';
import { Badge } from '@/components/ui/badge';


// --- Data for Laws ---
const laws = [
    {
        title: "Código Civil de Chile",
        description: "Regula los derechos y deberes entre padres e hijos, incluyendo la patria potestad, el cuidado personal y la obligación de alimentos.",
        articles: ["Art. 224–228: Cuidado personal y alimentos.", "Art. 232–243: Patria potestad."],
        link: "https://www.bcn.cl/leychile/navegar?idNorma=172986",
        icon: BookOpen,
    },
    {
        title: "Ley N° 19.947 – Nueva Ley de Matrimonio Civil",
        description: "Regula el matrimonio, divorcio, nulidad y separación judicial. Establece el divorcio de común acuerdo o por cese de convivencia.",
        articles: ["Art. 55 y siguientes: Procedimientos y requisitos del divorcio."],
        link: "https://www.bcn.cl/leychile/navegar?idNorma=225128",
        icon: Scale,
    },
    {
        title: "Ley N° 20.680 – Cuidado Personal y Corresponsabilidad Parental",
        description: "Permite a ambos padres solicitar el cuidado personal del hijo y establece el principio de corresponsabilidad, eliminando la presunción a favor de la madre.",
        articles: ["Publicada en: 2013."],
        link: "https://www.bcn.cl/leychile/navegar?idNorma=1059186",
        icon: Users2,
    },
    {
        title: "Ley N° 14.908 – Pago de Pensiones de Alimentos",
        description: "Regula la obligación legal de pagar pensión alimenticia, estableciendo mecanismos de cobro, sanciones y medidas de apremio.",
        articles: ["Art. 1–15: Procedimientos y sanciones por incumplimiento."],
        link: "https://www.bcn.cl/leychile/navegar?idNorma=28384",
        icon: Gavel,
    },
    {
        title: "Ley N° 19.968 – Tribunales de Familia",
        description: "Crea los Tribunales de Familia y define sus competencias, incluyendo materias como cuidado personal, relación directa y regular, y alimentos.",
        articles: ["Art. 8: Competencia de los tribunales."],
        link: "https://www.bcn.cl/leychile/navegar?idNorma=229557",
        icon: LandmarkIcon,
    },
    {
        title: "Ley N° 21.389 – Registro Nacional de Deudores de Pensiones de Alimentos",
        description: "Establece un registro público para deudores, permitiendo medidas como retención de fondos y bloqueo de trámites.",
        articles: ["Art. 2–9: Inscripción, sanciones y medidas coercitivas."],
        link: "https://www.bcn.cl/leychile/navegar?idNorma=1167484",
        icon: FileText,
    },
    {
        title: "Ley N° 20.066 – Ley de Violencia Intrafamiliar (VIF)",
        description: "Protege frente a violencia física, psicológica y económica en el entorno familiar, incluyendo medidas cautelares y sanciones.",
        articles: [],
        link: "https://www.bcn.cl/leychile/navegar?idNorma=242633",
        icon: AlertTriangle,
    },
    {
        title: "Convención sobre los Derechos del Niño (CDN)",
        description: "Ratificada por Chile en 1990, tiene supremacía sobre leyes internas si protege mejor al niño. Destaca el interés superior y el derecho a ser escuchado.",
        articles: ["Art. 3: Interés superior del niño.", "Art. 9: Derecho a mantener relación con ambos padres.", "Art. 12: Derecho a ser escuchado."],
        link: "https://www.un.org/es/events/childrenday/convention.shtml",
        icon: Globe2,
    }
];

// --- Data for Articles ---
const articles = [
  {
    icon: Gavel,
    title: "Derechos y deberes del padre separado",
    description: "Profundiza en la Ley N° 20.680 (“Ley Amor de Papá”), explicando cómo reconoce el derecho a ambos padres a solicitar y ejercitar el cuidado personal de los hijos, impulsando la corresponsabilidad parental. Detalla derechos como mantener una relación directa y regular, participar en decisiones clave, y deberes como la pensión de alimentos y el respeto a los regímenes acordados.",
  },
  {
    icon: BookOpen,
    title: "Patria potestad en Chile – derechos y obligaciones",
    description: "Explica en detalle la figura de la patria potestad: conjunto de derechos y deberes que los padres tienen sobre sus hijos no emancipados, incluyendo su representación legal, cuidado, educación, y administración de bienes. Aborda cómo se ejerce cuando los padres están separados y las posibilidades de modificación judicial.",
  },
  {
    icon: LandmarkIcon,
    title: "Deber y derecho preferente de educar",
    description: "Describe el derecho y deber de los padres de educar a sus hijos, consagrado en el Código Civil, la Constitución y la Ley General de Educación. Establece que este derecho preferente puede perderse en casos de abandono o incapacidad, e implica la elección libre del establecimiento y la participación activa en la vida escolar del menor.",
  },
];


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

const ArticleCard = ({ article }: { article: typeof articles[0] }) => (
  <Card className="h-full flex flex-col">
    <CardHeader>
      <div className="flex items-center gap-3 text-primary">
        <article.icon className="h-5 w-5" />
        <CardTitle className="text-xl font-semibold text-foreground">{article.title}</CardTitle>
      </div>
    </CardHeader>
    <CardContent className="flex-grow">
      <p className="text-sm text-muted-foreground">{article.description}</p>
    </CardContent>
    <CardFooter>
      <Button variant="outline" className="w-full mt-auto">
        Leer más <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </CardFooter>
  </Card>
);


const LawCard = ({ law }: { law: typeof laws[0] }) => {
    const { title, description, articles, link, icon: Icon } = law;
    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground mb-4">{description}</p>
                {articles.length > 0 && (
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-2">Puntos Clave</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            {articles.map((article, i) => (
                                <li key={i} className="flex items-start">
                                    <ArrowRight className="h-3 w-3 mr-2 mt-1 shrink-0 text-primary" />
                                    <span>{article}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                 <Button asChild className="w-full" variant="outline">
                    <a href={link} target="_blank" rel="noopener noreferrer">
                        <LinkIcon className="mr-2 h-4 w-4" /> Ver texto completo
                    </a>
                </Button>
            </CardFooter>
        </Card>
    );
};

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


async function AcademiaLegalContent() {
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
                       {articles.map((article, index) => (
                           <ArticleCard key={index} article={article} />
                       ))}
                    </div>
                </SectionCard>

                <SectionCard title="Leyes Vigentes" icon={Gavel}>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {laws.map((law, index) => (
                            <LawCard key={index} law={law} />
                        ))}
                    </div>
                </SectionCard>
                
                <SectionCard title="Red de Asesores Expertos" icon={Users}>
                    {legalExperts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
