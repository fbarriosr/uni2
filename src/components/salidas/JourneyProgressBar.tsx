'use client';

import * as React from "react";
import Link from 'next/link';
import { Compass, Lightbulb, ThumbsUp, CalendarDays, BookHeart, Camera, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppRoutes } from '@/lib/urls';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const journeySteps = [
  { name: 'Sugerencias', icon: Compass, href: (id: string) => AppRoutes.salidas.detail(id) },
  { name: 'Match', icon: ThumbsUp, href: (id: string) => AppRoutes.salidas.match(id) },
  { name: 'Itinerario', icon: CalendarDays, href: (id: string) => AppRoutes.salidas.itinerario(id) },
  { name: 'Bitácora', icon: BookHeart, href: (id: string) => AppRoutes.salidas.bitacora(id) },
  { name: 'Recuerdos', icon: Camera, href: (id: string) => AppRoutes.salidas.recuerdos(id) },
  { name: 'Evaluación', icon: Star, href: (id: string) => AppRoutes.salidas.evaluacion(id) },
];

export default function JourneyProgressBar({ currentStep, salidaId }: { currentStep: number; salidaId: string }) {
  return (
    <div className="w-full mt-4">
      <div className="grid grid-cols-3 gap-x-2 gap-y-4 md:grid-cols-6 md:gap-x-0 md:gap-y-0 md:flex md:items-center md:justify-between">
        {journeySteps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          
          const isConnectorActive = stepNumber < currentStep;
          // In mobile view (grid), hide connectors for items at the end of a row (3rd item)
          const hideConnector = (index + 1) % 3 === 0;

          const StepContent = (
            <div className="flex flex-col items-center text-center">
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border-2 transition-all duration-300',
                  isCompleted ? 'bg-primary border-primary text-primary-foreground' : '',
                  isActive ? 'bg-primary/20 border-primary text-primary scale-110 shadow-lg' : 'bg-muted border-border text-muted-foreground',
                  'cursor-pointer'
                )}
              >
                <step.icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <p
                className={cn(
                  'text-xs mt-1.5 font-medium w-full truncate',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {step.name}
              </p>
            </div>
          );

          return (
            <React.Fragment key={step.name}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={step.href(salidaId)}>
                      {StepContent}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{step.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {index < journeySteps.length - 1 && (
                <div
                  className={cn(
                    'h-1 transition-colors duration-300',
                    // On mobile, this is a vertical element, but we hide it.
                    // On desktop, it's a horizontal flex-grow element.
                    'hidden md:block md:flex-1 md:mx-2',
                    isConnectorActive ? 'bg-primary' : 'bg-border',
                     hideConnector && 'md:block', // ensure it shows on md+ even if it's the 3rd item
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
