
'use client';

import React from 'react';
import { addMonths, subMonths } from 'date-fns';
import { Gift } from 'lucide-react';
import type { CalendarProps } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from './ui/skeleton';
import CalendarDisplay, { type ImageHighlight, type BirthdayInfo } from './CalendarDisplay';
import { cn } from '@/lib/utils';

const LegendItem = ({ colorClass, label, icon: Icon, className }: { colorClass?: string; label: string; icon?: React.ElementType, className?: string }) => (
    <div className="flex items-center space-x-1.5">
      {Icon ? <Icon className={cn("w-4 h-4", className)} /> : <div className={`w-3.5 h-3.5 rounded-sm ${colorClass}`}></div>}
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
);

interface DualMonthCalendarProps extends Omit<CalendarProps, 'mode' | 'selected' | 'onSelect' | 'month' | 'onMonthChange'> {
  pastDates?: Date[];
  upcomingDates?: Date[];
  birthdayInfo?: BirthdayInfo[];
  imageHighlightData?: ImageHighlight[];
  mode?: 'range' | 'single' | 'default';
  selected?: Date | DateRange | undefined;
  onSelect?: (date: any) => void;
  month: Date;
  onMonthChange: (date: Date) => void;
  todayDate?: Date;
}


export default function DualMonthCalendar({
  pastDates = [],
  upcomingDates = [],
  birthdayInfo = [],
  imageHighlightData = [],
  mode = 'default',
  selected,
  onSelect,
  month,
  onMonthChange,
  todayDate,
  ...props
}: DualMonthCalendarProps) {

  const isMobile = useIsMobile();
  
  if (isMobile === null) {
      return (
        <div className="bg-card p-4 rounded-xl shadow-lg border">
          <Skeleton className="h-[550px] w-full" />
        </div>
      );
  }

  const numberOfMonths = isMobile ? 1 : 2;

  // Filter out upcoming dates that are already represented by an image highlight
  const upcomingDatesWithoutHighlights = upcomingDates.filter(
    upcomingDate => !imageHighlightData.some(highlight => new Date(highlight.date).toDateString() === upcomingDate.toDateString())
  );

  const modifiers: CalendarProps['modifiers'] = {
    past: pastDates,
    upcoming: upcomingDatesWithoutHighlights,
    birthdays: birthdayInfo.map(b => b.date),
    today: todayDate,
    ...props.modifiers,
  };

  const modifiersClassNames: CalendarProps['modifiersClassNames'] = {
    past: 'day-past text-muted-foreground/50 opacity-50',
    upcoming: 'day-upcoming', // Custom styling for busy days
    birthdays: 'day-birthday', // Styled in DayContent
    today: 'day-today', // Styled in DayContent
    ...props.modifiersClassNames,
  };

  const handlePrevMonth = () => onMonthChange(subMonths(month, 1));
  const handleNextMonth = () => onMonthChange(addMonths(month, 1));
  
  const renderLegend = () => {
    return (
        <>
            <LegendItem colorClass="bg-accent" label="Día actual" />
            <LegendItem icon={Gift} label="Cumpleaños" className="text-rose-500" />
            <LegendItem colorClass="bg-primary/20" label="Día ocupado" />
            {mode === 'range' && <LegendItem colorClass="bg-primary" label="Seleccionado" />}
        </>
    );
  };

  return (
    <div className="bg-card p-3 sm:p-4 rounded-xl shadow-lg border">
      <CalendarDisplay
        {...props}
        mode={mode}
        selected={mode === 'default' ? undefined : selected}
        onSelect={mode === 'default' ? undefined : onSelect}
        month={month}
        numberOfMonths={numberOfMonths}
        handlePrevMonth={handlePrevMonth}
        handleNextMonth={handleNextMonth}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        showOutsideDays={true}
        imageHighlightData={imageHighlightData}
        birthdayInfo={birthdayInfo}
      />
      <div className="p-2 sm:p-4 mt-2 border-t border-border/50 flex justify-center items-center flex-wrap gap-x-4 gap-y-2 sm:gap-x-6">
         {renderLegend()}
      </div>
    </div>
  );
}
