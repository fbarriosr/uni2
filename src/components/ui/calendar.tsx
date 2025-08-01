
"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, useDayPicker, useNavigation } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "./scroll-area"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={es}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label:
          props.captionLayout === "dropdown-buttons" ? "hidden" : "text-sm font-medium",
        caption_dropdowns: "flex justify-center gap-1",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "relative h-9 w-9 p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_start: "day-range-start bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_range_end: "day-range-end bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        day_upcoming: "bg-primary/20 text-foreground", // Added class for upcoming (busy) days
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
        Caption: ({ ...props }) => <CalendarCaption {...props} />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

function CalendarCaption({ displayMonth }: { displayMonth: Date }) {
  const {
    fromYear,
    fromMonth,
    fromDay,
    toYear,
    toMonth,
    toDay,
  } = useDayPicker();

  const { goToMonth, currentMonth } = useNavigation();

  const handleYearChange = (value: string) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(parseInt(value, 10));
    goToMonth(newDate);
  }

  const handleMonthChange = (value: string) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(parseInt(value, 10));
    goToMonth(newDate);
  }
  
  const years = React.useMemo(() => {
    const startYear = fromYear || fromDay?.getFullYear() || new Date().getFullYear() - 100;
    const endYear = toYear || toDay?.getFullYear() || new Date().getFullYear();
    const yearList = [];
    for (let i = endYear; i >= startYear; i--) {
        yearList.push(i);
    }
    return yearList;
  }, [fromYear, fromDay, toYear, toDay]);

  const months = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i,
      label: format(new Date(2000, i), 'MMMM', { locale: es }),
    }));
  }, []);

  return (
    <div className="flex justify-center gap-1">
      <Select
        value={currentMonth.getMonth().toString()}
        onValueChange={handleMonthChange}
      >
        <SelectTrigger className="w-fit focus:ring-0">
          <SelectValue>{format(currentMonth, 'MMMM', { locale: es })}</SelectValue>
        </SelectTrigger>
        <SelectContent>
            <ScrollArea className="h-48">
                {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                </SelectItem>
                ))}
            </ScrollArea>
        </SelectContent>
      </Select>
      <Select
        value={currentMonth.getFullYear().toString()}
        onValueChange={handleYearChange}
      >
        <SelectTrigger className="w-[100px] focus:ring-0">
          <SelectValue>{currentMonth.getFullYear()}</SelectValue>
        </SelectTrigger>
        <SelectContent>
            <ScrollArea className="h-48">
            {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                {year}
                </SelectItem>
            ))}
            </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  )
}
CalendarCaption.displayName = "CalendarCaption"

export { Calendar }
