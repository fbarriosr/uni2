
'use client';

import { Calendar } from 'lucide-react';
import JourneyProgressBar from './JourneyProgressBar';
import CancelOutingButton from './CancelOutingButton';
import type { ReactNode } from 'react';
import { Button } from '../ui/button';

interface SalidaPageHeaderProps {
  title: string;
  subtitle: string;
  salidaId: string;
  userId: string | null;
  currentStep: number;
  children?: ReactNode; // To pass extra buttons like 'Edit' or 'Share'
}

export default function SalidaPageHeader({
  title,
  subtitle,
  salidaId,
  userId,
  currentStep,
  children,
}: SalidaPageHeaderProps) {
  return (
    <header className="mb-8">
      <div className="relative p-6 bg-card rounded-xl shadow-lg border">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-4">
            <div className="flex-grow">
                 <div className="flex items-center text-lg text-muted-foreground mb-2">
                    <Calendar className="mr-2 h-5 w-5 text-primary" />
                    <span className="font-semibold">{subtitle}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-headline text-foreground max-w-2xl">
                    {title}
                </h1>
            </div>
             {userId && (
              <div className="shrink-0">
                <CancelOutingButton salidaId={salidaId} userId={userId} />
              </div>
            )}
        </div>
       
        <JourneyProgressBar currentStep={currentStep} salidaId={salidaId} />
        
        {children && (
            <div className="mt-4 pt-4 border-t border-dashed flex items-center justify-end gap-2">
                {children}
            </div>
        )}
      </div>
    </header>
  );
}
