
'use client';

import type { ActivityFilterCriteria, ActivityCategory } from '@/lib/types';
import { SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { activityCategories } from '@/lib/data';

interface ActivityFilterBarProps {
  filters: ActivityFilterCriteria;
  onFilterChange: (newFilters: ActivityFilterCriteria) => void;
}

export default function ActivityFilterBar({ filters, onFilterChange }: ActivityFilterBarProps) {
  return (
    <div className="p-4 md:p-6 mb-8 border rounded-lg bg-card shadow-lg">
      <h2 className="text-xl font-headline flex items-center mb-4"><SlidersHorizontal className="mr-3 h-5 w-5"/>Filtros de Búsqueda</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="search" className="text-xs">Buscar por nombre</Label>
          <Input 
            id="search"
            placeholder="Ej: Parque, Museo..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="category" className="text-xs">Categoría</Label>
          <Select value={filters.category || 'any'} onValueChange={(v) => onFilterChange({ ...filters, category: v as ActivityCategory | 'any' })}>
            <SelectTrigger id="category" className="mt-1">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Todas las categorías</SelectItem>
              {activityCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="price" className="text-xs">Precio</Label>
          <Select value={filters.price || 'any'} onValueChange={(v) => onFilterChange({ ...filters, price: v as 'free' | 'paid' | 'any' })}>
            <SelectTrigger id="price" className="mt-1">
              <SelectValue placeholder="Cualquiera" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Cualquier precio</SelectItem>
              <SelectItem value="free">Gratis</SelectItem>
              <SelectItem value="paid">De pago</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="rating" className="text-xs">Valoración mínima: {filters.averageRating}</Label>
          <Slider 
            id="rating"
            min={0}
            max={5}
            step={0.5}
            value={[filters.averageRating || 0]}
            onValueChange={(value) => onFilterChange({ ...filters, averageRating: value[0] })}
            className="pt-2 mt-2.5"
          />
        </div>
      </div>
    </div>
  );
}
