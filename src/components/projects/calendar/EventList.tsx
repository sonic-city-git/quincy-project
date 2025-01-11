import { CalendarEvent } from "@/types/events";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";

interface EventListProps {
  events: CalendarEvent[];
}

export function EventList({ events }: EventListProps) {
  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Project Events</h2>
      <div className="grid gap-2">
        {sortedEvents.map((event, index) => (
          <Card key={`${event.date}-${index}`} className="p-3">
            <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4">
              <div className="flex items-center gap-1.5 shrink-0">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {format(event.date, 'dd.MM.yyyy')}
                </span>
              </div>
              <h3 className="font-medium text-sm truncate">{event.name}</h3>
              <div 
                className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${event.type.color}`}
              >
                {event.type.name}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground opacity-50 shrink-0">
                <Clock className="h-3.5 w-3.5" />
                <span>Options coming soon</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}