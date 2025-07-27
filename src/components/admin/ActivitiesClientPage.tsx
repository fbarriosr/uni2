
'use client';

import { useState } from 'react';
import type { Activity, ActivityStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, MapPin, Tag, Star } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { AppRoutes } from '@/lib/urls';
import DeleteActivityButton from './DeleteActivityButton';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { activityStatuses } from '@/lib/data';
import Image from 'next/image';

interface ActivitiesClientPageProps {
  initialActivities: Activity[];
}

const ITEMS_PER_PAGE = 12;

export default function ActivitiesClientPage({ initialActivities }: ActivitiesClientPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredActivities = initialActivities.filter(activity => {
    const searchMatch = activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.category.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === 'all' || activity.status === statusFilter;
    return searchMatch && statusMatch;
  });

  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedActivities = filteredActivities.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getStatusVariant = (status?: ActivityStatus) => {
    switch (status) {
      case 'publicada':
        return 'default';
      case 'deshabilitada':
        return 'destructive';
      case 'borrador':
        return 'secondary';
      case 'pendiente_revision':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };


  return (
    <div className="container mx-auto py-8">
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-headline text-foreground">Gestión de Actividades</h1>
            <p className="text-muted-foreground mt-1">Crea, edita y administra las actividades de la plataforma.</p>
          </div>
          <Button asChild>
              <Link href={AppRoutes.admin.newActivity}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Crear Actividad
              </Link>
          </Button>
      </header>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Buscar por nombre, ubicación o categoría..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to first page on new search
          }}
          className="flex-grow"
        />
        <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
        }}>
            <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {activityStatuses.map(status => (
                <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedActivities.length > 0 ? (
          paginatedActivities.map((activity) => (
            <Card key={activity.id} className="flex flex-col transition-shadow hover:shadow-xl overflow-hidden">
                <CardHeader className="p-0 relative">
                    <Image
                        src={activity.mainImage || 'https://placehold.co/600x400.png?text=Sin+Imagen'}
                        alt={activity.name}
                        width={400}
                        height={250}
                        className="w-full h-40 object-cover"
                        data-ai-hint="activity photo"
                    />
                    {activity.averageRating !== undefined && (
                        <Badge variant="secondary" className="absolute top-2 right-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm shadow-md">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-bold">{activity.averageRating.toFixed(1)}</span>
                        </Badge>
                    )}
                </CardHeader>
                <CardContent className="p-3 flex-grow">
                    <CardTitle className="text-base font-semibold leading-tight mb-2 truncate">{activity.name}</CardTitle>
                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
                        <Badge variant={getStatusVariant(activity.status)} className="text-xs">
                            {(activity.status || 'borrador').replace('_', ' ')}
                        </Badge>
                        <div className="flex items-center">
                            <Tag className="h-3 w-3 mr-1" />
                            <span>{activity.category}</span>
                        </div>
                    </div>
                    <div className="flex items-start text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1 mt-0.5 shrink-0" />
                        <span className="truncate">{activity.location}</span>
                    </div>
                </CardContent>
                <CardFooter className="p-2 border-t bg-muted/50 flex justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={AppRoutes.admin.editActivity(activity.id)}>
                            <Edit className="mr-1.5 h-3 w-3" />
                            Editar
                        </Link>
                    </Button>
                    <DeleteActivityButton activityId={activity.id} activityName={activity.name} />
                </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-24 text-center">
            <p className="text-muted-foreground">No se encontraron actividades con los filtros actuales.</p>
          </div>
        )}
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-4 py-4 mt-4">
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
