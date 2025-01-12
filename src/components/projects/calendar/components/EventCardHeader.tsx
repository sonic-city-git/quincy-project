import { Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { CalendarEvent } from "@/types/events";

interface EventCardHeaderProps {
  event: CalendarEvent;
}

export function EventCardHeader({ event }: EventCardHeaderProps) {
  return (
    <>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {format(event.date, 'dd.MM.yy')}
        </span>
      </div>
      
      <div className="flex flex-col">
        <div className="flex items-start">
          <span className="font-medium text-base">
            {event.name}
          </span>
        </div>
        {event.location && (
          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{event.location}</span>
          </div>
        )}
      </div>
    </>
  );
}