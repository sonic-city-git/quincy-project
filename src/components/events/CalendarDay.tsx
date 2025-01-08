import { DayProps } from "react-day-picker";
import { EventType } from "@/types/events";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCalendarDate } from "@/hooks/useCalendarDate";
import { format } from "date-fns";
import { useEvents } from "@/contexts/EventsContext";
import { CalendarDayContent } from "./CalendarDayContent";

interface CalendarDayProps extends Omit<DayProps, 'date'> {
  date: Date;
  eventColors: Record<EventType, string>;
  onSelect: (date: Date) => void;
  className?: string;
}

export const CalendarDay = ({ 
  date: dayDate,
  eventColors,
  onSelect,
  className,
  ...props 
}: CalendarDayProps) => {
  const { normalizeDate } = useCalendarDate();
  const { findEvent } = useEvents();
  const event = findEvent(dayDate);
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelect(dayDate);
  };

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            {...props}
            className={`
              relative h-9 w-9 p-0 font-normal 
              flex items-center justify-center text-sm 
              cursor-pointer hover:bg-accent 
              transition-colors duration-200
              rounded-md shadow-sm
              ${className || ''} 
              ${event ? `${eventColors[event.type]} text-white font-medium` : ''}
            `}
            onClick={handleClick}
          >
            <CalendarDayContent date={dayDate} event={event} />
          </button>
        </TooltipTrigger>
        {event && (
          <TooltipContent className="text-base px-4 py-2">
            <div>{event.name}</div>
            <div className="text-sm text-muted-foreground">
              {format(event.date, 'dd.MM.yy')}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};