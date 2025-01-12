import { CalendarEvent } from "@/types/events";
import { Calendar, Users } from "lucide-react";
import { format } from "date-fns";

interface EventCardProps {
  event: CalendarEvent;
}

export function EventCard({ event }: EventCardProps) {
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
      </div>

      <div className="flex items-center justify-between">
        {event.location && (
          <div className="flex items-center text-muted-foreground">
            <span className="text-sm">{event.location}</span>
          </div>
        )}
        {event.type?.needs_crew && (
          <div className="flex items-center text-muted-foreground">
            <Users className="h-4 w-4" />
          </div>
        )}
      </div>
    </>
  );
}