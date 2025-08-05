import React from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarEvent } from '@/types/events';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { getStatusIcon } from '@/utils/eventFormatters';

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  event?: CalendarEvent;
  isSelected: boolean;
  onClick: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseEnter?: () => void;
  onMouseUp?: (e: React.MouseEvent) => void;
}

export function CalendarDay({
  date,
  isCurrentMonth,
  isToday,
  event,
  isSelected,
  onClick,
  onMouseDown,
  onMouseEnter,
  onMouseUp
}: CalendarDayProps) {
  const baseButtonClasses = cn(
    "h-10 w-full p-0 font-normal relative",
    !isCurrentMonth && "text-muted-foreground opacity-50",
    isToday && "border border-blue-500",
    "hover:bg-zinc-800 rounded-md transition-colors",
    !event && isSelected && "bg-blue-500/30"
  );

  const getEventOpacity = (event: CalendarEvent) => {
    return event.status === 'cancelled' || event.status === 'invoiced' ? '80' : 'D9';
  };

  const renderDayContent = () => {
    return (
      <button
        onClick={onClick}
        onMouseDown={(e) => {
          if (onMouseDown) {
            e.preventDefault(); // Prevent text selection during drag
            onMouseDown(e);
          }
        }}
        onMouseEnter={onMouseEnter}
        onMouseUp={(e) => {
          if (onMouseUp) {
            e.preventDefault();
            onMouseUp(e);
          }
        }}
        onDragStart={(e) => e.preventDefault()} // Prevent default drag behavior
        className={cn(
          baseButtonClasses,
          isSelected && !event && "bg-blue-500/30 text-white",
          event && !isSelected && `bg-opacity-85 text-white`,
          isSelected && event && "text-white"
        )}
        style={event ? {
          backgroundColor: `${event.type.color}${getEventOpacity(event)}`
        } : undefined}
      >
        <span className="relative z-10">{format(date, 'd')}</span>
      </button>
    );
  };

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
        className="z-[100] bg-zinc-950 border border-zinc-800 text-white p-3 rounded-md shadow-xl w-auto"
      >
        <div className="space-y-1.5 text-center">
          <div className="flex items-center justify-center gap-2">
            <p className="font-semibold text-white">{event.name}</p>
            {getStatusIcon(event.status)}
          </div>
          <p className="text-sm text-zinc-300">{event.type.name}</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}