'use client';

import type { ActivityFilterCriteria, ActivityCategory } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { activityCategories } from '@/lib/data';
import { useFilters } from '@/contexts/FilterContext';

export default function ActivityFilters() {
  const { filters: contextFilters, setFilters } = useFilters();

  // Ensure 'filters' is always an object, even if contextFilters is unexpectedly undefined.
  // This should ideally not happen if useFilters() and FilterProvider work as expected.
  const filters = contextFilters || {
    search: undefined,
    location: undefined,
    price: undefined,
    category: undefined,
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...(prev || {}), [name]: value }));
  };

  const handleSelectChange = (name: keyof ActivityFilterCriteria) => (value: string) => {
    setFilters(prev => ({ ...(prev || {}), [name]: value === 'any' ? undefined : value }));
  };

  const clearFilters = () => {
    setFilters({ location: undefined, price: undefined, category: undefined, search: undefined });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="search" className="text-sm font-medium">Buscar por nombre</Label>
        <Input
          id="search"
          name="search"
          type="text"
          placeholder="Ej: Parque, Museo..."
          value={filters.search || ''}
          onChange={handleInputChange}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="location" className="text-sm font-medium">Ubicación</Label>
        <Input
          id="location"
          name="location"
          type="text"
          placeholder="Ej: Ciudad Ejemplo"
          value={filters.location || ''}
          onChange={handleInputChange}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="price" className="text-sm font-medium">Precio</Label>
        <Select name="price" value={filters.price || 'any'} onValueChange={handleSelectChange('price')}>
          <SelectTrigger id="price" className="w-full mt-1">
            <SelectValue placeholder="Seleccionar precio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Cualquiera</SelectItem>
            <SelectItem value="free">Gratis</SelectItem>
            <SelectItem value="paid">De pago</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="category" className="text-sm font-medium">Categoría</Label>
        <Select name="category" value={filters.category || 'any'} onValueChange={handleSelectChange('category')}>
          <SelectTrigger id="category" className="w-full mt-1">
            <SelectValue placeholder="Seleccionar categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Todas</SelectItem>
            {activityCategories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="mt-6 flex justify-end">
          <Button onClick={clearFilters} variant="ghost" className="text-muted-foreground w-full">
            <X size={16} className="mr-1" />
            Limpiar Filtros
          </Button>
        </div>
    </div>
  );
}
