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
  selected?: Date[];
  events?: CalendarEvent[];
  onSelect?: (dates: Date[] | undefined) => void;
  onDayMouseEnter?: (date: Date) => void;
  onDayClick?: (date: Date) => void;
  onDayMouseUp?: (date: Date) => void;
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
  onDayMouseUp,
  className,
}: CalendarProps) {
  console.log('Calendar render', { selected, events });

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

  return (
    <div className={cn("p-3", className)}>
      <CalendarHeader month={month} onMonthChange={onMonthChange || (() => {})} />
      
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
          week.map((day, dayIndex) => {
            const event = getEventForDate(day);
            const isSelected = selected.some(selectedDate => isSameDay(selectedDate, day));
            
            return (
              <div key={`${weekIndex}-${dayIndex}`} className="p-0 relative">
                <CalendarDay
                  date={day}
                  isCurrentMonth={isSameMonth(day, month)}
                  isToday={isToday(day)}
                  event={event}
                  isSelected={isSelected}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    console.log('Calendar day mouseDown', { day, event });
                    if (!event && mode === 'multiple') {
                      onSelect?.([day]);
                    }
                  }}
                  onMouseEnter={() => {
                    console.log('Calendar day mouseEnter', { day, selected });
                    onDayMouseEnter?.(day);
                  }}
                  onMouseUp={() => {
                    console.log('Calendar day mouseUp', { day, selected });
                    onDayMouseUp?.(day);
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