
'use client';

import type { ActivityFilterCriteria } from '@/lib/types';
import type { Dispatch, SetStateAction, ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';

interface FilterContextType {
  filters: ActivityFilterCriteria;
  setFilters: Dispatch<SetStateAction<ActivityFilterCriteria>>;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<ActivityFilterCriteria>({
    location: undefined,
    price: undefined,
    category: undefined,
    search: undefined,
  });

  return (
    <FilterContext.Provider value={{ filters, setFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}
