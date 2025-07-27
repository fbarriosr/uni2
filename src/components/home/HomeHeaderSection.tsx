
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type React from 'react';

interface Acompanante {
  name: string;
  src: string;
  aiHint: string;
}

interface HomeHeaderSectionProps {
  acompanantes: Acompanante[];
}

const HomeHeaderSection: React.FC<HomeHeaderSectionProps> = ({ acompanantes }) => {
  return (
    <section className="flex flex-col md:flex-row justify-between items-start gap-4 mt-4 md:mt-8 mb-8 md:mb-10">
      <div className="w-full md:w-[70%] text-center md:text-left">
        <h1 className="text-3xl md:text-[clamp(2.5rem,6vw,4rem)] font-black text-foreground leading-tight">
          Descubre Aventuras Familiares Inolvidables
        </h1>
      </div>
      <div className="w-full md:w-[30%] flex flex-col items-center md:items-end space-y-2">
        <p className="text-xs text-muted-foreground self-start md:self-end">Acompañantes:</p>
        <div className="flex items-center space-x-2 flex-wrap justify-center md:justify-end">
          {acompanantes.map((a) => (
            <div key={a.name} className="flex flex-col items-center text-center">
              <Avatar className="h-10 w-10 md:h-12 md:w-12">
                <AvatarImage src={a.src} alt={a.name} data-ai-hint={a.aiHint} />
                <AvatarFallback>{a.name.substring(0, 1)}</AvatarFallback>
              </Avatar>
              <span className="text-xs mt-1 text-muted-foreground">{a.name}</span>
            </div>
          ))}
          <Button variant="outline" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-full border-dashed">
            <Plus size={20} className="text-muted-foreground" />
            <span className="sr-only">Agregar acompañante</span>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HomeHeaderSection;
