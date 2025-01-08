import { CalendarEvent } from "@/types/events";
import { format } from "date-fns";

interface CalendarDayContentProps {
  date: Date;
  event?: CalendarEvent;
}

export const CalendarDayContent = ({ date, event }: CalendarDayContentProps) => {
  return (
    <>
      {date.getDate()}
      {event && (
        <div className="text-sm text-muted-foreground">
          {format(event.date, 'dd.MM.yy')}
        </div>
      )}
    </>
  );
};