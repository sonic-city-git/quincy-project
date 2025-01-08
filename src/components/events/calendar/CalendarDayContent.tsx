import { EventType } from "@/types/events";
import { format } from "date-fns";

interface CalendarDayContentProps {
  date: Date;
  eventName?: string;
  eventType?: EventType;
}

export const CalendarDayContent = ({ date, eventName, eventType }: CalendarDayContentProps) => {
  return (
    <>
      <div>{date.getDate()}</div>
      {eventName && (
        <div className="text-sm text-muted-foreground">
          <div>{eventName}</div>
          <div className="text-xs">{format(date, 'dd.MM.yy')}</div>
        </div>
      )}
    </>
  );
};