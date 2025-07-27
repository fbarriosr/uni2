
'use client';

import * as React from "react";
import Link from 'next/link';
import { Compass, Lightbulb, ThumbsUp, CalendarDays, Camera, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppRoutes } from '@/lib/urls';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const journeySteps = [
  { name: 'Exploración', icon: Compass, href: (id: string) => AppRoutes.salidas.detail(id) },
  { name: 'Ideas', icon: Lightbulb, href: (id: string) => AppRoutes.salidas.detail(id) },
  { name: 'Match', icon: ThumbsUp, href: (id: string) => AppRoutes.salidas.match(id) },
  { name: 'Itinerario', icon: CalendarDays, href: (id: string) => AppRoutes.salidas.itinerario(id) },
  { name: 'Recuerdos', icon: Camera, href: (id: string) => AppRoutes.salidas.recuerdos(id) },
  { name: 'Evaluación', icon: Star, href: (id: string) => AppRoutes.salidas.evaluacion(id) },
];

export default function JourneyProgressBar({ currentStep, salidaId }: { currentStep: number; salidaId: string }) {
  return (
    <div className="w-full mt-4">
      <div className="flex items-center justify-between">
        {journeySteps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          const StepContent = (
            <div className="flex flex-col items-center text-center">
              <div
                className={cn(
                  'flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300',
                  isCompleted ? 'bg-primary border-primary text-primary-foreground' : '',
                  isActive ? 'bg-primary/20 border-primary text-primary scale-110 shadow-lg' : '',
                  isUpcoming ? 'bg-muted border-border text-muted-foreground' : '',
                  'cursor-pointer'
                )}
              >
                <step.icon className="w-6 h-6" />
              </div>
              <p
                className={cn(
                  'text-xs mt-2 font-medium w-20 truncate',
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
                    'flex-1 h-1 transition-colors duration-300 mx-2',
                    isCompleted || isActive ? 'bg-primary' : 'bg-border'
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
