import { CalendarEvent } from "@/types/events";
import { EventSectionHeader } from "./components/EventSectionHeader";
import { EventSectionContent } from "./components/EventSectionContent";

interface EventSectionProps {
  title: string;
  events: CalendarEvent[];
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit: (event: CalendarEvent) => void;
}

export function EventSection({ title, events, onStatusChange, onEdit }: EventSectionProps) {
  // Get the event type from the first event in the section
  const eventType = events[0]?.type;

  return (
    <div className="space-y-2">
      <EventSectionHeader 
        title={title} 
        eventCount={events.length} 
        eventType={eventType}
      />
      <EventSectionContent 
        events={events}
        onStatusChange={onStatusChange}
        onEdit={onEdit}
      />
    </div>
  );
}