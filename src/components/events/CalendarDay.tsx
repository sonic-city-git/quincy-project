import { DayProps } from "react-day-picker";
import { CalendarEvent, EventType } from "@/types/events";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCalendarDate } from "@/hooks/useCalendarDate";
import { CalendarDayContent } from "./calendar/CalendarDayContent";
import { CalendarDayWrapper } from "./calendar/CalendarDayWrapper";

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
  onSelect,
  className,
  ...props 
}: CalendarDayProps) => {
  const { normalizeDate } = useCalendarDate();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelect(dayDate);
  };

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <CalendarDayWrapper
            eventType={event?.type}
            className={className}
            onClick={handleClick}
          >
            <CalendarDayContent
              date={dayDate}
              eventName={event?.name}
              eventType={event?.type}
            />
          </CalendarDayWrapper>
        </TooltipTrigger>
        {event && (
          <TooltipContent className="text-base px-4 py-2">
            <CalendarDayContent
              date={event.date}
              eventName={event.name}
              eventType={event.type}
            />
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};