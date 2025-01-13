import { CalendarEvent } from "@/types/events";
import { EventCard } from "../EventCard";
import { EventSectionHeader } from "./components/EventSectionHeader";
import { EventSectionContent } from "./components/EventSectionContent";

interface EventSectionProps {
  title: string;
  events: CalendarEvent[];
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit: (event: CalendarEvent) => void;
}

export function EventSection({ title, events, onStatusChange, onEdit }: EventSectionProps) {
  const eventType = events[0]?.type;

  return (
    <div className="mb-8">
      <EventSectionHeader 
        title={title}
        eventType={eventType}
        events={events}
        onStatusChange={onStatusChange}
      />
      <EventSectionContent>
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
            sectionTitle={title}
          />
        ))}
      </EventSectionContent>
    </div>
  );
}