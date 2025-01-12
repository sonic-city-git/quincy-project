import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { CalendarEvent } from "@/types/events";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { EventSectionHeader } from "./components/EventSectionHeader";
import { EventSectionContent } from "./components/EventSectionContent";
import { useSyncCrew } from "./hooks/useSyncCrew";
import { useSectionSyncStatus } from "./hooks/useSectionSyncStatus";
import { getStatusIcon } from "@/utils/eventFormatters";

interface EventSectionProps {
  status: CalendarEvent['status'] | 'done and dusted';
  events: CalendarEvent[];
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit?: (event: CalendarEvent) => void;
}

export function EventSection({ status, events, onStatusChange, onEdit }: EventSectionProps) {
  // If there are no events in this section, don't render anything
  if (events.length === 0) return null;

  const [isOpen, setIsOpen] = useState(status !== 'done and dusted');
  const { isSyncing, handleSyncCrew } = useSyncCrew();
  const sectionSyncStatus = useSectionSyncStatus(events);

  const isDoneAndDusted = status === 'done and dusted';
  const isCancelled = status === 'cancelled';
  const canSync = status === 'proposed' || status === 'confirmed';

  const sectionIcon = isDoneAndDusted ? (
    <Brush className="h-6 w-6 text-gray-400" />
  ) : (
    <div className="h-6 w-6 flex items-center justify-center">
      {getStatusIcon(status)}
    </div>
  );

  // Calculate total price for all events in this section
  const totalPrice = events.reduce((sum, event) => sum + (event.revenue || 0), 0);

  if (isDoneAndDusted) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="rounded-lg bg-zinc-800/45 hover:bg-zinc-800/50">
          <CollapsibleTrigger className="flex items-center justify-between w-full group p-4">
            <div className="flex items-center gap-2">
              {sectionIcon}
              <h3 className="text-lg font-semibold whitespace-nowrap">Done and Dusted</h3>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''} ml-2`} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <EventSectionContent
              events={events}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
            />
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-zinc-800/45 hover:bg-zinc-800/50">
        <div className="p-4">
          <EventSectionHeader
            status={status}
            events={events}
            sectionIcon={sectionIcon}
            sectionSyncStatus={sectionSyncStatus}
            totalPrice={totalPrice}
            canSync={canSync}
            isSyncing={isSyncing}
            handleSyncCrew={() => handleSyncCrew(events)}
            onStatusChange={onStatusChange}
            isCancelled={isCancelled}
          />
        </div>
        <EventSectionContent
          events={events}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
        />
      </div>
    </div>
  );
}