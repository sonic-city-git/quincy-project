import { CalendarEvent } from "@/types/events";
import { EventSection } from "./EventSection";
import { EventListEmpty } from "./components/EventListEmpty";
import { EventListLoading } from "./components/EventListLoading";
import { groupEventsByStatus } from "./utils/eventGroups";
import { Card } from "@/components/ui/card";
import { Brush, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

  const { proposed, confirmed, ready, cancelled, doneAndDusted } = groupEventsByStatus(events);

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
      {doneAndDusted.length > 0 && (
        <Collapsible defaultOpen={false}>
          <Card className="rounded-lg bg-zinc-800/45 p-6">
            <CollapsibleTrigger className="flex items-center gap-2 w-full">
              <div className="flex items-center gap-2">
                <Brush className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-semibold">Done and Dusted</h3>
              </div>
              <ChevronDown className="h-4 w-4 ml-auto transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <EventSection
                title="Done and Dusted"
                events={doneAndDusted}
                onStatusChange={onStatusChange}
                hideEdit
              />
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
}