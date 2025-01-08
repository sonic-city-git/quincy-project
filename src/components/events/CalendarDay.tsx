import { DayProps } from "react-day-picker";
import { CalendarEvent, EventType } from "@/types/events";
import { useCalendarDate } from "@/hooks/useCalendarDate";
import { CalendarDayContent } from "./CalendarDayContent";

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
  const { normalizeDate } = useCalendarDate();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelect(dayDate);
  };

  return (
    <CalendarDayContent
      date={dayDate}
      event={event}
      eventColors={eventColors}
      onClick={handleClick}
      className={className}
    />
  );
};