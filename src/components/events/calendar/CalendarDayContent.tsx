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
      <div className="text-base font-semibold">{date.getDate()}</div>
      {eventName && (
        <div className="w-full text-center">
          <div className="text-xs font-medium truncate max-w-full">
            {eventName}
          </div>
          <div className="text-[10px] opacity-80">
            {format(date, 'dd.MM.yy')}
          </div>
        </div>
      )}
    </>
  );
};