import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { CalendarEvent } from '@/types/events';

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  event?: CalendarEvent;
  isSelected?: boolean;
  onClick?: () => void;
  onMouseDown?: () => void;
  onMouseEnter?: () => void;
  onMouseUp?: () => void;
}

export const CalendarDay = memo(function CalendarDay({
  date,
  isCurrentMonth,
  isToday,
  event,
  isSelected,
  onClick,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
}: CalendarDayProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseUp={onMouseUp}
      className={cn(
        "w-full aspect-square p-2 flex flex-col items-center justify-start relative",
        "hover:bg-zinc-800/50 rounded-md transition-colors",
        !isCurrentMonth && "opacity-50",
        isSelected && "bg-zinc-800/50",
        event && "cursor-pointer"
      )}
    >
      <span
        className={cn(
          "text-sm font-normal",
          isToday && "bg-white text-black rounded-full w-6 h-6 flex items-center justify-center"
        )}
      >
        {date.getDate()}
      </span>
      {event && (
        <div
          className="mt-1 w-full px-1 py-0.5 text-[0.65rem] rounded-sm truncate text-center"
          style={{ backgroundColor: event.type.color }}
        >
          {event.name}
        </div>
      )}
    </button>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.date.getTime() === nextProps.date.getTime() &&
    prevProps.isCurrentMonth === nextProps.isCurrentMonth &&
    prevProps.isToday === nextProps.isToday &&
    prevProps.isSelected === nextProps.isSelected &&
    JSON.stringify(prevProps.event) === JSON.stringify(nextProps.event)
  );
});