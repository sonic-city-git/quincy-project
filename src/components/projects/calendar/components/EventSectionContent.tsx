import { CalendarEvent } from "@/types/events";
import { EventCard } from "../EventCard";

interface EventSectionContentProps {
  events: CalendarEvent[];
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit?: (event: CalendarEvent) => void;
}

export function EventSectionContent({
  events,
  onStatusChange,
  onEdit
}: EventSectionContentProps) {
  return (
    <div className="px-4 pb-4">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}