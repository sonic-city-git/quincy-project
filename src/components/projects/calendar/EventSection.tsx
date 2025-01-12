import { CalendarEvent } from "@/types/events";
import { EventCard } from "./EventCard";
import { EventSectionHeader } from "./components/EventSectionHeader";
import { EventSectionContent } from "./components/EventSectionContent";

interface EventSectionProps {
  title: string;
  events: CalendarEvent[];
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit?: (event: CalendarEvent) => void;
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
  if (!events.length) return null;

  // Get the event type from the first event in the section
  const eventType = events[0]?.type;

  return (
    <div className="space-y-4">
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
        onEdit={hideEdit ? undefined : onEdit}
      >
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onStatusChange={onStatusChange}
            onEdit={hideEdit ? undefined : onEdit}
          />
        ))}
      </EventSectionContent>
    </div>
  );
}