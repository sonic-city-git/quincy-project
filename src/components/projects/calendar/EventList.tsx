import { CalendarEvent } from "@/types/events";
import { EventSection } from "./EventSection";
import { EventListEmpty } from "./components/EventListEmpty";
import { EventListLoading } from "./components/EventListLoading";
import { useEventUpdate } from "@/hooks/useEventUpdate";
import { useEventDialog } from "@/hooks/useEventDialog";
import { groupEventsByStatus } from "./utils/eventGroups";

interface EventListProps {
  events: CalendarEvent[];
  projectId: string;
  isLoading?: boolean;
}

export function EventList({ events, projectId, isLoading }: EventListProps) {
  const { updateEvent } = useEventUpdate(projectId);
  const { openEditDialog } = useEventDialog();

  if (isLoading) {
    return <EventListLoading />;
  }

  if (!events.length) {
    return <EventListEmpty />;
  }

  const handleStatusChange = async (event: CalendarEvent, newStatus: CalendarEvent['status']) => {
    await updateEvent({ ...event, status: newStatus });
  };

  const handleEdit = (event: CalendarEvent) => {
    console.log('Opening edit dialog for event:', event);
    openEditDialog(event);
  };

  const groupedEvents = groupEventsByStatus(events);

  return (
    <div className="space-y-6">
      <EventSection
        status="proposed"
        events={groupedEvents.proposed}
        onStatusChange={handleStatusChange}
        onEdit={handleEdit}
      />
      <EventSection
        status="confirmed"
        events={groupedEvents.confirmed}
        onStatusChange={handleStatusChange}
        onEdit={handleEdit}
      />
      <EventSection
        status="invoice ready"
        events={groupedEvents.invoice_ready}
        onStatusChange={handleStatusChange}
        onEdit={handleEdit}
      />
      <EventSection
        status="cancelled"
        events={groupedEvents.cancelled}
        onStatusChange={handleStatusChange}
        onEdit={handleEdit}
      />
      <EventSection
        status="done and dusted"
        events={groupedEvents.pastEvents}
        onStatusChange={handleStatusChange}
        onEdit={handleEdit}
      />
    </div>
  );
}