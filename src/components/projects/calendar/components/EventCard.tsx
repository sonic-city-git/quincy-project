import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { CalendarEvent } from "@/types/events";

interface EventCardProps {
  event: CalendarEvent;
}

export function EventCard({ event }: EventCardProps) {
  const iconClasses = "h-6 w-6 flex-shrink-0";
  
  return (
    <>
      <div className="flex items-center gap-2">
        <Calendar className={`${iconClasses} text-muted-foreground`} />
        <span className="text-sm text-muted-foreground">
          {format(event.date, 'dd.MM.yy')}
        </span>
      </div>
      
      <div className="flex flex-col justify-center">
        <div className="flex items-center">
          <span className="font-medium text-base truncate">
            {event.name}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {event.location && (
          <div className="flex items-center text-muted-foreground">
            <span className="text-sm truncate">{event.location}</span>
          </div>
        )}
      </div>
    </>
  );
}