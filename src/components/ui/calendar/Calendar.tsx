import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday,
  startOfWeek,
  endOfWeek,
  isSameDay
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
  // Filter out any null/undefined events and events with invalid dates
  const validEvents = events.filter(event => event && event.date);


  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 }); // 1 = Monday
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 }); // 1 = Monday
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
    return validEvents.find(event => {
      try {
        return isSameDay(new Date(event.date), date);
      } catch (error) {
        console.warn('Invalid date in event:', event);
        return false;
      }
    });
  };

  const isDateSelected = (date: Date): boolean => {
    return selectedDates.some(selectedDate => isSameDay(selectedDate, date));
  };

  return (
    <div className={cn("p-1 sm:p-2 md:p-3 select-none w-full", className)}>
      <CalendarHeader month={month} onMonthChange={onMonthChange || (() => {})} />
      
      <div className="grid grid-cols-7 mt-2 sm:mt-3 md:mt-4">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div
            key={day}
            className="text-muted-foreground rounded-md font-normal text-[0.6rem] sm:text-[0.7rem] md:text-[0.8rem] flex h-6 sm:h-8 md:h-10 w-full items-center justify-center"
          >
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 mt-1 sm:mt-2 gap-0.5 sm:gap-1 w-full">
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
                
                    onDayClick?.(day);
                  }}
                  onMouseDown={(e) => {
                    if (!event && onDragStart) {
                      onDragStart(day);
                    }
                  }}
                  onMouseEnter={() => {
                    if (!event && onDragEnter) {
                      onDragEnter(day);
                    }
                  }}
                  onMouseUp={(e) => {
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