import { DayProps } from "react-day-picker";
import { CalendarEvent, EventType } from "@/types/events";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CalendarDayProps extends Omit<DayProps, 'date'> {
  date: Date;
  event?: CalendarEvent;
  eventColors: Record<EventType, string>;
  onSelect: (date: Date) => void;
  className?: string;
}

export const CalendarDay = ({ 
  date: dayDate,
  event,
  eventColors,
  onSelect,
  className,
  ...props 
}: CalendarDayProps) => {
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
            {dayDate.getDate()}
          </button>
        </TooltipTrigger>
        {event && (
          <TooltipContent className="text-base px-4 py-2">
            {event.name}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};