import { CalendarEvent } from "@/types/events";
import { EventSection } from "./EventSection";
import { EventListEmpty } from "./components/EventListEmpty";
import { EventListLoading } from "./components/EventListLoading";
import { groupEventsByStatus } from "./utils/eventGroups";
import { Card } from "@/components/ui/card";

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
      {proposed.length > 0 && (
        <Card className="rounded-lg bg-zinc-800/45 p-6">
          <EventSection
            title="Proposed"
            events={proposed}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
          />
        </Card>
      )}
      {confirmed.length > 0 && (
        <Card className="rounded-lg bg-zinc-800/45 p-6">
          <EventSection
            title="Confirmed"
            events={confirmed}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
          />
        </Card>
      )}
      {ready.length > 0 && (
        <Card className="rounded-lg bg-zinc-800/45 p-6">
          <EventSection
            title="Invoice Ready"
            events={ready}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
          />
        </Card>
      )}
      {cancelled.length > 0 && (
        <Card className="rounded-lg bg-zinc-800/45 p-6">
          <EventSection
            title="Cancelled"
            events={cancelled}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
          />
        </Card>
      )}
    </div>
  );
}