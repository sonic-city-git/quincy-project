import { CalendarEvent } from "@/types/events";
import { getStatusIcon, getStatusText } from "@/utils/eventFormatters";
import { EventCard } from "./EventCard";

interface EventSectionProps {
  status: string;
  events: CalendarEvent[];
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
}

export function EventSection({ status, events, onStatusChange }: EventSectionProps) {
  if (events.length === 0) return null;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {getStatusIcon(status)}
        <h3 className="text-lg font-semibold">{getStatusText(status)}</h3>
      </div>
      <div className="grid gap-3">
        {events.map(event => (
          <EventCard 
            key={`${event.date}-${event.name}`}
            event={event} 
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </div>
  );
}