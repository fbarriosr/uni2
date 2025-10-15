'use client';

import Link from 'next/link';
import AuthCheck from '@/components/AuthCheck';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowRight, Activity, Ticket, User, ClipboardList, BookOpen, GraduationCap, Trophy, FileText, Star, BookMarked, Gavel, Bot } from 'lucide-react';
import { AppRoutes } from '@/lib/urls';

const adminSections = [
  {
    title: 'Gestión de Usuarios',
    description: 'Crea, edita y administra los usuarios de la aplicación.',
    href: AppRoutes.admin.users,
    icon: User,
  },
  {
    title: 'Gestión de Actividades',
    description: 'Crea, edita y publica las actividades disponibles en la plataforma.',
    href: AppRoutes.admin.activities,
    icon: Activity
  },
  {
    title: 'Gestión de Cupones',
    description: 'Administra los códigos de descuento para los usuarios.',
    href: AppRoutes.admin.cupones,
    icon: Ticket
  },
  {
    title: 'Gestión de Agentes de IA',
    description: 'Personaliza los asistentes de inteligencia artificial.',
    href: AppRoutes.admin.configuracionesAgentes,
    icon: Bot
  },
  {
    title: 'Gestión de Reclamos',
    description: 'Revisa y responde a los reclamos y sugerencias de los usuarios.',
    href: AppRoutes.admin.claims,
    icon: ClipboardList
  },
  {
    title: 'Academia: Rutas Aprendizaje',
    description: 'Gestiona las rutas de aprendizaje personalizadas.',
    href: AppRoutes.admin.learningPaths,
    icon: GraduationCap,
  },
  {
    title: 'Academia: Micro-Lecciones',
    description: 'Gestiona las micro-lecciones interactivas.',
    href: AppRoutes.admin.microLessons,
    icon: BookOpen,
  },
  {
    title: 'Academia: Desafíos',
    description: 'Gestiona los desafíos semanales y mensuales.',
    href: AppRoutes.admin.challenges,
    icon: Trophy,
  },
  {
    title: 'Academia: Artículos',
    description: 'Gestiona los artículos y recursos.',
    href: AppRoutes.admin.articles,
    icon: FileText,
  },
  {
    title: 'Academia: Expertos',
    description: 'Gestiona la red de expertos de Uni2.',
    href: AppRoutes.admin.experts,
    icon: Star,
  },
  {
    title: 'Academia: Lecturas',
    description: 'Gestiona las lecturas sugeridas.',
    href: AppRoutes.admin.suggestedReadings,
    icon: BookMarked,
  },
  {
    title: 'Legal: Expertos',
    description: 'Gestiona la red de abogados y asesores legales.',
    href: AppRoutes.admin.legalExperts,
    icon: Gavel,
  },
];

function AdminDashboard() {
  return (
    <div className="container mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-headline text-foreground">Panel de Administración</h1>
        <p className="text-muted-foreground mt-1">
          Bienvenido. Desde aquí puedes gestionar los aspectos clave de la aplicación UNI2.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => (
          <Link key={section.title} href={section.href} className="group block">
            <Card className="h-full hover:border-primary hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  {section.title}
                </CardTitle>
                <section.icon className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {section.description}
                </p>
                <div className="flex items-center pt-4 text-sm font-medium text-primary group-hover:underline">
                  Ir a la sección <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
    return (
        <AuthCheck>
           <AdminDashboard />
        </AuthCheck>
    );
}
