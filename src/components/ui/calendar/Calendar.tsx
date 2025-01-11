import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  addDays, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isSameDay,
  startOfWeek,
  endOfWeek,
  isToday
} from 'date-fns';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { CalendarEvent } from '@/types/events';

interface CalendarProps {
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

export function Calendar({
  mode = 'single',
  month = new Date(),
  onMonthChange,
  selected = [],
  events = [],
  onSelect,
  onDayMouseEnter,
  onDayClick,
  className,
}: CalendarProps) {
  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    const days = eachDayOfInterval({ start, end });

    const weeks = [];
    let currentWeek = [];

    days.forEach(day => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    return weeks;
  }, [month]);

  const getEventForDate = (date: Date): CalendarEvent | undefined => {
    return events.find(event => isSameDay(new Date(event.date), date));
  };

  const renderDay = (date: Date) => {
    const event = getEventForDate(date);
    const isSelected = selected.some(selectedDate => isSameDay(selectedDate, date));
    const isCurrentMonth = isSameMonth(date, month);
    const dayIsToday = isToday(date);

    const baseButtonClasses = cn(
      "h-10 w-full p-0 font-normal relative",
      !isCurrentMonth && "text-muted-foreground opacity-50",
      dayIsToday && "border border-blue-500",
      "hover:bg-zinc-800 rounded-md transition-colors"
    );

    const renderDayContent = () => (
      <button
        key={date.toString()}
        onClick={() => {
          onDayClick?.(date);
          if (mode === 'multiple') {
            onSelect?.([...(selected || []), date]);
          }
        }}
        onMouseEnter={() => onDayMouseEnter?.(date)}
        onMouseDown={(e) => {
          e.preventDefault();
          onDayClick?.(date);
          if (mode === 'multiple') {
            onSelect?.([date]);
          }
        }}
        onMouseUp={(e) => {
          e.preventDefault();
        }}
        className={cn(
          baseButtonClasses,
          isSelected && !event && "bg-blue-500/30 text-white",
          event && !isSelected && `bg-opacity-85 text-white`,
          isSelected && event && "bg-blue-500/30 text-white"
        )}
        style={event && !isSelected ? {
          backgroundColor: `${event.type.color}D9`
        } : undefined}
      >
        <span className="relative z-10">{format(date, 'd')}</span>
      </button>
    );

    if (!event) {
      return renderDayContent();
    }

    return (
      <HoverCard key={date.toString()} openDelay={100} closeDelay={0}>
        <HoverCardTrigger asChild>
          {renderDayContent()}
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
          {format(month, 'MMMM yyyy')}
        </div>
        <div className="space-x-1 flex items-center absolute right-1">
          <Button
            variant="ghost"
            className="h-10 w-10 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-full"
            onClick={() => onMonthChange?.(addDays(month, -30))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            className="h-10 w-10 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-full"
            onClick={() => onMonthChange?.(addDays(month, 30))}
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
      <div className="grid grid-cols-7 mt-2 gap-1">
        {weeks.map((week, weekIndex) => 
          week.map((day, dayIndex) => (
            <div key={`${weekIndex}-${dayIndex}`} className="p-0 relative">
              {renderDay(day)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}