
'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Pencil } from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface ActivityPreferenceFiltersProps {
  filterOptions: FilterOption[];
  selectedFilters: string[];
  onFilterChange: (id: string, checked: boolean) => void;
  otherValue: string;
  onOtherValueChange: (value: string) => void;
}

const FilterCheckbox: React.FC<FilterOption & { isChecked: boolean; onCheckedChange: (checked: boolean) => void }> = ({ id, label, icon, isChecked, onCheckedChange }) => (
    <div className="flex items-center space-x-2">
        <Checkbox 
            id={`filter-${id}`} 
            checked={isChecked}
            onCheckedChange={onCheckedChange}
        />
        <Label htmlFor={`filter-${id}`} className="flex items-center text-sm text-foreground cursor-pointer">
            {icon}
            <span className="ml-1.5">{label}</span>
        </Label>
    </div>
);

const ActivityPreferenceFilters: React.FC<ActivityPreferenceFiltersProps> = ({ filterOptions, selectedFilters, onFilterChange, otherValue, onOtherValueChange }) => {
  return (
    <section>
      <h2 className="text-xl font-headline text-primary mb-4">¿Qué les gustaría hacer?</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-4">
        {filterOptions.map(opt => (
          <FilterCheckbox 
            key={opt.id} 
            id={opt.id} 
            label={opt.label} 
            icon={opt.icon} 
            isChecked={selectedFilters.includes(opt.id)}
            onCheckedChange={(checked) => onFilterChange(opt.id, checked as boolean)}
          />
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-dashed">
        <Label htmlFor="other-preference" className="flex items-center text-sm text-foreground font-medium mb-2">
            <Pencil className="mr-1.5 h-4 w-4" />
            Otra preferencia
        </Label>
        <Input
            id="other-preference"
            placeholder="Ej: Ir de compras, astronomía..."
            value={otherValue}
            onChange={(e) => onOtherValueChange(e.target.value)}
        />
    </div>
    </section>
  );
};

export default ActivityPreferenceFilters;
