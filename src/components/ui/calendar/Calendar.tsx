import React, { useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday,
  startOfWeek,
  endOfWeek,
  isSameDay,
  differenceInDays
} from 'date-fns';
import { CalendarEvent } from '@/types/events';
import { CalendarHeader } from './CalendarHeader';
import { CalendarDay } from './CalendarDay';

interface CalendarProps {
  mode?: 'single' | 'multiple';
  month?: Date;
  onMonthChange?: (date: Date) => void;
  events?: CalendarEvent[];
  onDayClick?: (date: Date) => void;
  className?: string;
  selectedDates?: Date[];
  onDragStart?: (date: Date) => void;
  onDragEnter?: (date: Date) => void;
  onDragEnd?: () => void;
}

export function Calendar({
  mode = 'single',
  month = new Date(),
  onMonthChange,
  events = [],
  onDayClick,
  className,
  selectedDates = [],
  onDragStart,
  onDragEnter,
  onDragEnd,
}: CalendarProps) {
  console.log('Calendar render', { events });

  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 }); // 1 = Monday
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 }); // 1 = Monday
    
    // Pre-calculate the number of days and weeks
    const totalDays = differenceInDays(end, start) + 1;
    const numberOfWeeks = Math.ceil(totalDays / 7);
    
    // Pre-allocate the weeks array
    const weeks: Date[][] = Array(numberOfWeeks).fill(null).map(() => []);
    const days = eachDayOfInterval({ start, end });

    // Fill the weeks array
    days.forEach((day, index) => {
      const weekIndex = Math.floor(index / 7);
      weeks[weekIndex].push(day);
    });

    return weeks;
  }, [month]);

  const getEventForDate = useCallback((date: Date): CalendarEvent | undefined => {
    return events.find(event => isSameDay(new Date(event.date), date));
  }, [events]);

  const isDateSelected = useCallback((date: Date): boolean => {
    return selectedDates.some(selectedDate => isSameDay(selectedDate, date));
  }, [selectedDates]);

  return (
    <div className={cn("p-3", className)}>
      <CalendarHeader month={month} onMonthChange={onMonthChange || (() => {})} />
      
      <div className="grid grid-cols-7 mt-4">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
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
          week.map((day, dayIndex) => {
            const event = getEventForDate(day);
            
            return (
              <div key={`${weekIndex}-${dayIndex}`} className="p-0 relative">
                <CalendarDay
                  date={day}
                  isCurrentMonth={isSameMonth(day, month)}
                  isToday={isToday(day)}
                  event={event}
                  isSelected={isDateSelected(day)}
                  onClick={() => {
                    console.log('Calendar day clicked', { day, event });
                    onDayClick?.(day);
                  }}
                  onMouseDown={() => {
                    if (!event && onDragStart) {
                      onDragStart(day);
                    }
                  }}
                  onMouseEnter={() => {
                    if (!event && onDragEnter) {
                      onDragEnter(day);
                    }
                  }}
                  onMouseUp={() => {
                    if (!event && onDragEnd) {
                      onDragEnd();
                    }
                  }}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}