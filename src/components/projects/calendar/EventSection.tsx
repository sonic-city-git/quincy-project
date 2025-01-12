import { CalendarEvent } from "@/types/events";
import { EventCard } from "./EventCard";
import { EventSectionHeader } from "./components/EventSectionHeader";
import { EventSectionContent } from "./components/EventSectionContent";

interface EventSectionProps {
  title: string;
  events: CalendarEvent[];
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit: (event: CalendarEvent) => void;
}

export function EventSection({ title, events, onStatusChange, onEdit }: EventSectionProps) {
  if (!events.length) return null;

  return (
    <div className="space-y-4">
      <EventSectionHeader title={title} count={events.length} />
      <EventSectionContent>
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
          />
        ))}
      </EventSectionContent>
    </div>
  );
}