import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay } from 'date-fns';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card';
import { CalendarEvent } from '@/types/events';

interface CustomCalendarProps {
  mode?: 'single' | 'multiple';
  month?: Date;
  onMonthChange?: (date: Date) => void;
  selected?: Date[];
  events?: CalendarEvent[];
  onSelect?: (dates: Date[] | undefined) => void;
  onDayMouseEnter?: (date: Date) => void;
  onDayClick?: (date: Date) => void;
  className?: string;
}

export function CustomCalendar({
  mode = 'single',
  month = new Date(),
  onMonthChange,
  selected = [],
  events = [],
  onSelect,
  onDayMouseEnter,
  onDayClick,
  className,
}: CustomCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(month);

  const handleMonthChange = (newMonth: Date) => {
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const handleDayClick = (date: Date) => {
    if (mode === 'multiple') {
      const newSelected = [...selected, date];
      onSelect?.(newSelected);
    }
    onDayClick?.(date);
  };

  const getEventForDate = (date: Date): CalendarEvent | undefined => {
    return events.find(event => 
      isSameDay(new Date(event.date), date)
    );
  };

  const renderDay = (date: Date) => {
    const event = getEventForDate(date);
    const isSelected = selected.some(selectedDate => isSameDay(selectedDate, date));
    const isCurrentMonth = isSameMonth(date, currentMonth);

    if (!event) {
      return (
        <button
          key={date.toString()}
          onClick={() => handleDayClick(date)}
          onMouseEnter={() => onDayMouseEnter?.(date)}
          className={cn(
            "h-10 w-full p-0 font-normal relative",
            !isCurrentMonth && "text-muted-foreground opacity-50",
            isSelected && "bg-blue-500/50 text-white",
            "hover:bg-zinc-800 rounded-md transition-colors"
          )}
        >
          {format(date, 'd')}
        </button>
      );
    }

    return (
      <HoverCard key={date.toString()}>
        <HoverCardTrigger asChild>
          <button
            onClick={() => handleDayClick(date)}
            onMouseEnter={() => onDayMouseEnter?.(date)}
            className={cn(
              "h-10 w-full p-0 font-normal relative",
              isSelected && "bg-blue-500/50",
              "rounded-md transition-colors"
            )}
            style={{
              backgroundColor: `${event.type.color}D9`,
              color: '#FFFFFF'
            }}
          >
            {format(date, 'd')}
          </button>
        </HoverCardTrigger>
        <HoverCardContent 
          align="center"
          side="top"
          sideOffset={5}
          className="z-[100] bg-zinc-950 border border-zinc-800 text-white p-3 rounded-md shadow-xl w-[200px]"
        >
          <div className="space-y-1.5">
            <p className="font-semibold text-white">{event.name}</p>
            <p className="text-sm text-zinc-300">{event.type.name}</p>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  return (
    <div className={cn("p-3", className)}>
      <div className="flex justify-center pt-1 relative items-center">
        <div className="text-xl font-medium">
          {format(currentMonth, 'MMMM yyyy')}
        </div>
        <div className="space-x-1 flex items-center absolute right-1">
          <Button
            variant="ghost"
            className="h-10 w-10 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-full"
            onClick={() => handleMonthChange(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            className="h-10 w-10 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-full"
            onClick={() => handleMonthChange(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 mt-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-muted-foreground rounded-md font-normal text-[0.8rem] flex h-10 w-full items-center justify-center"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 mt-2">
        {days.map((day) => (
          <div key={day.toString()} className="p-0 relative">
            {renderDay(day)}
          </div>
        ))}
      </div>
    </div>
  );
}