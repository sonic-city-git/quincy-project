import { CalendarEvent } from "@/types/events";
import { getStatusIcon } from "@/utils/eventFormatters";
import { EventCard } from "./EventCard";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { EventStatusManager } from "./EventStatusManager";

interface EventSectionProps {
  status: CalendarEvent['status'] | 'done and dusted';
  events: CalendarEvent[];
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit?: (event: CalendarEvent) => void;
}

export function EventSection({ status, events, onStatusChange, onEdit }: EventSectionProps) {
  const [isOpen, setIsOpen] = useState(status !== 'done and dusted');

  if (!events.length) return null;

  const sectionIcon = getStatusIcon(status === 'done and dusted' ? 'invoiced' : status);
  const isDoneAndDusted = status === 'done and dusted';
  const isCancelled = status === 'cancelled';

  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'proposed':
        return 'bg-yellow-500/5';
      case 'confirmed':
        return 'bg-green-500/5';
      case 'invoice ready':
        return 'bg-blue-500/5';
      case 'cancelled':
        return 'bg-red-500/5';
      default:
        return 'bg-zinc-800/5';
    }
  };

  const getStatusText = (status: string) => {
    return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
  };

  const content = (
    <div className="space-y-2">
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

  if (isDoneAndDusted) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full group">
          <div className="flex items-center gap-2">
            {sectionIcon}
            <h3 className="text-lg font-semibold">{getStatusText(status)}</h3>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''} ml-2`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className={`p-4 rounded-lg ${getStatusBackground(status)}`}>
            {content}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {sectionIcon}
          <h3 className="text-lg font-semibold">{getStatusText(status)}</h3>
        </div>
        <EventStatusManager
          status={status}
          events={events}
          onStatusChange={onStatusChange}
          isCancelled={isCancelled}
        />
      </div>
      <div className={`p-4 rounded-lg ${getStatusBackground(status)}`}>
        {content}
      </div>
    </div>
  );
}