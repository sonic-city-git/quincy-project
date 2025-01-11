import { CalendarEvent } from "@/types/events";
import { EventSection } from "./EventSection";
import { useEventGroups } from "./hooks/useEventGroups";
import { useEventStatusUpdate } from "./hooks/useEventStatusUpdate";

interface EventListProps {
  events: CalendarEvent[];
  projectId?: string;
}

export function EventList({ events, projectId }: EventListProps) {
  const { groupedEvents, pastEvents } = useEventGroups(events);
  const { handleStatusChange } = useEventStatusUpdate(projectId);

  return (
    <div className="space-y-8">
      <EventSection 
        status="proposed"
        events={groupedEvents.proposed}
        onStatusChange={handleStatusChange}
      />
      <EventSection 
        status="confirmed"
        events={groupedEvents.confirmed}
        onStatusChange={handleStatusChange}
      />
      <EventSection 
        status="invoice ready"
        events={groupedEvents.invoice_ready}
        onStatusChange={handleStatusChange}
      />
      <EventSection 
        status="cancelled"
        events={groupedEvents.cancelled}
        onStatusChange={handleStatusChange}
      />
      {pastEvents.length > 0 && (
        <div className="border-t pt-8">
          <EventSection 
            status="done and dusted"
            events={pastEvents}
            onStatusChange={handleStatusChange}
          />
        </div>
      )}
    </div>
  );
}