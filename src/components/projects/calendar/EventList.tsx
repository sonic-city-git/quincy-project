import { CalendarEvent } from "@/types/events";
import { EventSection } from "./EventSection";
import { EventListEmpty } from "./components/EventListEmpty";
import { EventListLoading } from "./components/EventListLoading";
import { groupEventsByStatus } from "./utils/eventGroups";

interface EventListProps {
  events: CalendarEvent[];
  isLoading?: boolean;
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit: (event: CalendarEvent) => void;
}

export function EventList({ events, isLoading, onStatusChange, onEdit }: EventListProps) {
  if (isLoading) {
    return <EventListLoading />;
  }

  if (!events.length) {
    return <EventListEmpty />;
  }

  const { proposed, confirmed, ready, cancelled } = groupEventsByStatus(events);

  return (
    <div className="space-y-8">
      <div className="border border-zinc-800 rounded-lg bg-zinc-900/50 backdrop-blur-sm p-6 space-y-8">
        <EventSection
          title="Proposed"
          events={proposed}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
        />
        <EventSection
          title="Confirmed"
          events={confirmed}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
        />
        <EventSection
          title="Invoice Ready"
          events={ready}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
        />
        <EventSection
          title="Cancelled"
          events={cancelled}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
        />
      </div>
    </div>
  );
}