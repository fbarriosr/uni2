
'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Calendar, type CalendarProps } from '@/components/ui/calendar';
import { ChevronLeft, ChevronRight, Gift } from 'lucide-react';
import { format, addMonths, subMonths, isSameDay, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export interface ImageHighlight {
  date: string;
  imageUrl: string;
  aiHint?: string;
  isSpecialHighlight?: boolean;
  isPast?: boolean;
}

export interface BirthdayInfo {
  date: Date;
  name: string;
}

interface CalendarDisplayProps extends CalendarProps {
  imageHighlightData: ImageHighlight[];
  birthdayInfo: BirthdayInfo[];
  month: Date;
  numberOfMonths: number;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
}

export default function CalendarDisplay({
  imageHighlightData = [],
  birthdayInfo = [],
  month,
  numberOfMonths,
  handlePrevMonth,
  handleNextMonth,
  ...props
}: CalendarDisplayProps) {

    const DayContent: CalendarProps['components']['DayContent'] = ({ date, activeModifiers }) => {
        const dayNumber = date.getDate();
    
        const matchingOuting = imageHighlightData.find(outing => {
          try {
            if (typeof outing.date !== 'string') {
              console.warn("Fecha no es un string:", outing.date);
              return false;
            }
        
            const parsedOutingDate = parse(outing.date, "dd MMM yyyy", new Date(), { locale: es });
            return isSameDay(parsedOutingDate, date);
          } catch (e) {
            console.error("Date parsing error in CalendarDisplay:", e);
            return false;
          }
        });
        

        const birthdaysOnThisDay = birthdayInfo.filter(b => isSameDay(b.date, date));
        const birthdayNames = birthdaysOnThisDay.map(b => b.name).join(' y ');

        const dayNumberComponent = (
            <span className={cn("flex items-center justify-center h-8 w-8 rounded-full text-sm",
                activeModifiers.today && "bg-accent text-accent-foreground font-semibold",
                matchingOuting && "relative z-10 font-bold text-white text-lg sm:text-xl"
            )}>
                {dayNumber}
            </span>
        );
    
        const birthdayIndicator = birthdaysOnThisDay.length > 0 && (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="absolute -top-1 -right-1 z-20">
                           <Gift className="h-6 w-6 text-rose-500 bg-white rounded-full p-0.5" />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="flex items-center gap-2"><Gift size={16} />Cumpleaños de {birthdayNames}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );

        if (matchingOuting) {
            return (
              <div
                className={cn(
                  "relative w-full h-full flex items-center justify-center rounded-md overflow-hidden",
                  matchingOuting.isSpecialHighlight && "ring-2 ring-primary ring-offset-1"
                )}
              >
                <Image
                    src={matchingOuting.imageUrl}
                    alt="Indicador de Salida"
                    fill
                    className={cn(
                      "absolute inset-0 object-cover transition-transform duration-300 group-hover:scale-105", 
                      matchingOuting.isPast && "saturate-50"
                    )}
                    data-ai-hint={matchingOuting.aiHint || "outing indicator"}
                  />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                {dayNumberComponent}
                {birthdayIndicator}
              </div>
            );
        }
        
        if (birthdaysOnThisDay.length > 0) {
            return (
                <div className="relative w-full h-full flex items-center justify-center">
                    {dayNumberComponent}
                    {birthdayIndicator}
                </div>
            );
        }

        return dayNumberComponent;
    };
  
    const headerText = () => {
        const firstMonthName = format(month, "MMMM", { locale: es });
        const firstYear = format(month, "yyyy");

        if (numberOfMonths === 1) {
            return `${firstMonthName} ${firstYear}`;
        }

        const secondMonth = addMonths(month, 1);
        const secondMonthName = format(secondMonth, "MMMM", { locale: es });
        const secondYear = format(secondMonth, "yyyy");

        if (firstYear === secondYear) {
          return `${firstMonthName} - ${secondMonthName} ${firstYear}`;
        }
        return `${format(month, "MMMM yyyy", { locale: es })} - ${format(secondMonth, "MMMM yyyy", { locale: es })}`;
    }

    return (
        <>
            <div className="flex items-center justify-between pb-4 px-1 sm:px-2">
                <h3 className="text-lg font-headline text-foreground capitalize">
                    {headerText()}
                </h3>
                <div className="flex items-center space-x-1">
                    <Button variant="outline" size="icon" onClick={handlePrevMonth} aria-label="Mes anterior" className="h-8 w-8 sm:h-9 sm:w-9">
                        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleNextMonth} aria-label="Mes siguiente" className="h-8 w-8 sm:h-9 sm:w-9">
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                </div>
            </div>
            <Calendar
                {...props}
                month={month}
                onMonthChange={()=>{}} // Navigation is handled by custom buttons
                className="p-0 w-full"
                numberOfMonths={numberOfMonths}
                classNames={{
                    months: "flex flex-col sm:flex-row sm:divide-x sm:divide-border",
                    month: "space-y-4 flex-1 px-1 sm:px-3",
                    caption: "hidden", 
                    nav_button: "hidden", 
                    head_row: "flex",
                    head_cell: "text-muted-foreground rounded-md w-full font-medium text-xs uppercase tracking-wider text-center flex-1",
                    row: "flex w-full mt-2",
                    cell: "text-center p-0 relative aspect-square flex-1",
                    day: "h-full w-full p-0 font-normal text-sm aria-selected:opacity-100 hover:bg-accent/20 rounded-md transition-colors flex items-center justify-center",
                    day_selected: "bg-red-600 text-white rounded-l-md hover:bg-red-700 hover:text-white", // Handled by DayContent
                    day_outside: "text-muted-foreground/50",
                    day_disabled: "text-muted-foreground/30",
                    day_range_start:
                      "day-range-start bg-red-600 text-white rounded-l-md hover:bg-red-700 hover:text-white",
                    day_range_end:
                      "day-range-end bg-red-600 text-white rounded-r-md hover:bg-red-700 hover:text-white",
                    day_range_middle: "aria-selected:bg-primary/20 aria-selected:text-foreground",
                }}
                components={{
                    DayContent: DayContent,
                }}
            />
        </>
    );
}
