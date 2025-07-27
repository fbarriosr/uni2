
'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import MiSalidaButton, { type MiSalidaButtonProps as MiSalidaButtonType } from '@/components/MiSalidaButton'; // Use a different alias for the type
import type { ActivityFilterCriteria } from '@/lib/types';
import type React from 'react';

interface HomeActionsSectionProps {
  filters: Partial<ActivityFilterCriteria>; // Make filters partial as they might not all be set
  setFilters: React.Dispatch<React.SetStateAction<ActivityFilterCriteria>>;
  miSalidaButtons: MiSalidaButtonType[]; // Use the imported type alias
}

const HomeActionsSection: React.FC<HomeActionsSectionProps> = ({ filters, setFilters, miSalidaButtons }) => {
  return (
    <section className="mb-6 md:mb-8">
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start justify-between">
        <div className="w-full md:w-1/2">
          <h2 className="text-lg font-semibold text-foreground mb-2">Buscador</h2>
          <form className="flex w-full gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <Input
                id="home-search"
                type="text"
                placeholder="Escribe ideas para salir"
                value={filters.search || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 w-full shadow-sm h-11 text-base rounded-md"
              />
            </div>
            <Button
              type="submit"
              size="default"
              className="h-11 bg-primary text-primary-foreground hover:bg-primary/90 px-5 rounded-md whitespace-nowrap"
            >
              Buscar
            </Button>
          </form>
        </div>
        <div className="w-full md:w-1/2">
          <div className="flex flex-col md:items-start">
            <h2 className="text-lg font-semibold text-foreground mb-2">Mi Salida</h2>
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
              {miSalidaButtons.map((btn) => (
                <MiSalidaButton key={btn.label} {...btn} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeActionsSection;
