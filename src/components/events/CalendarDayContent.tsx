import { CalendarEvent, EventType } from "@/types/events";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CalendarDayContentProps {
  date: Date;
  event?: CalendarEvent;
  eventColors: Record<EventType, string>;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}

export const CalendarDayContent = ({
  date,
  event,
  eventColors,
  onClick,
  className = "",
}: CalendarDayContentProps) => {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={`
              relative h-12 w-12 p-0 font-normal 
              flex items-center justify-center text-base
              cursor-pointer transition-colors duration-200
              rounded-md
              ${className}
              ${event ? `${eventColors[event.type]} text-white font-medium hover:opacity-90` : 'hover:bg-accent'}
            `}
          >
            {date.getDate()}
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