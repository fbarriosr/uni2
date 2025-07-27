'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface TransportOption {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface TransportModeSelectorProps {
  transportOptions: TransportOption[];
  value: string;
  onValueChange: (value: string) => void;
}

const TransportModeSelector: React.FC<TransportModeSelectorProps> = ({ transportOptions, value, onValueChange }) => {
  return (
    <section>
      <h2 className="text-xl font-headline text-primary mb-4">¿Cómo van?</h2>
      <RadioGroup value={value} onValueChange={onValueChange} className="flex flex-wrap gap-x-6 gap-y-3">
        {transportOptions.map(opt => (
          <div key={opt.id} className="flex items-center space-x-2">
            <RadioGroupItem value={opt.id} id={`transport-${opt.id}`} />
            <Label htmlFor={`transport-${opt.id}`} className="flex items-center text-sm text-foreground cursor-pointer">
              {opt.icon}
              <span className="ml-1.5">{opt.label}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </section>
  );
};

export default TransportModeSelector;
