import { CalendarEvent } from "@/types/events";
import { EventCard } from "./EventCard";
import { EventSectionHeader } from "./components/EventSectionHeader";
import { EventSectionContent } from "./components/EventSectionContent";

interface EventSectionProps {
  title: string;
  events: CalendarEvent[];
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit: ((event: CalendarEvent) => void) | undefined;
  hideEdit?: boolean;
  hideHeader?: boolean;
}

export function EventSection({ 
  title, 
  events, 
  onStatusChange, 
  onEdit,
  hideEdit,
  hideHeader 
}: EventSectionProps) {
  const eventType = events[0]?.type;

  return (
    <div className="mb-8">
      {!hideHeader && (
        <EventSectionHeader 
          title={title}
          eventType={eventType}
          events={events}
          onStatusChange={onStatusChange}
        />
      )}
      <EventSectionContent
        events={events}
        onStatusChange={onStatusChange}
        onEdit={onEdit}
      >
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