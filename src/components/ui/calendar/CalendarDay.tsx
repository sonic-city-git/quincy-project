import React from 'react';
import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarEvent } from '@/types/events';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  event?: CalendarEvent;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseUp: () => void;
}

export function CalendarDay({
  date,
  isCurrentMonth,
  isToday,
  event,
  isSelected,
  onMouseDown,
  onMouseEnter,
  onMouseUp
}: CalendarDayProps) {
  const baseButtonClasses = cn(
    "h-10 w-full p-0 font-normal relative",
    !isCurrentMonth && "text-muted-foreground opacity-50",
    isToday && "border border-blue-500",
    "hover:bg-zinc-800 rounded-md transition-colors"
  );

  const renderDayContent = () => (
    <button
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseUp={onMouseUp}
      className={cn(
        baseButtonClasses,
        isSelected && !event && "bg-blue-500/30 text-white",
        event && !isSelected && `bg-opacity-85 text-white`,
        isSelected && event && "text-white"
      )}
      style={event ? {
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
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        {renderDayContent()}
      </HoverCardTrigger>
      <HoverCardContent 
        align="center"
        side="top"
        sideOffset={5}
        className="z-[100] bg-zinc-950 border border-zinc-800 text-white p-3 rounded-md shadow-xl max-w-[300px] w-auto"
      >
        <div className="space-y-1.5">
          <p className="font-semibold text-white">{event.name}</p>
          <p className="text-sm text-zinc-300">{event.type.name}</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}