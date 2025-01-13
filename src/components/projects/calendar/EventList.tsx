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
    <div className="space-y-4">
      {proposed.length > 0 && (
        <Card className="rounded-lg bg-zinc-800/50 p-4">
          <EventSection
            title="Proposed"
            events={proposed}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
          />
        </Card>
      )}
      {confirmed.length > 0 && (
        <Card className="rounded-lg bg-zinc-800/50 p-4">
          <EventSection
            title="Confirmed"
            events={confirmed}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
          />
        </Card>
      )}
      {ready.length > 0 && (
        <Card className="rounded-lg bg-zinc-800/50 p-4">
          <EventSection
            title="Invoice Ready"
            events={ready}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
          />
        </Card>
      )}
      {cancelled.length > 0 && (
        <Card className="rounded-lg bg-zinc-800/50 p-4">
          <EventSection
            title="Cancelled"
            events={cancelled}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
          />
        </Card>
      )}
      {doneAndDusted.length > 0 && (
        <Collapsible defaultOpen={false} className="mb-16">
          <Card className="rounded-lg bg-zinc-800/45 p-4">
            <CollapsibleTrigger className="flex items-center gap-2 w-full">
              <div className="flex items-center gap-2">
                <Brush className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-muted-foreground">Done and Dusted</h3>
              </div>
              <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              {doneAndDusted.map((event) => (
                <EventSection
                  key={event.id}
                  title="Done and Dusted"
                  events={[event]}
                  onStatusChange={onStatusChange}
                  onEdit={undefined}
                  hideEdit
                  hideHeader
                />
              ))}
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
}