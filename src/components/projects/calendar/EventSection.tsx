import { Button } from "@/components/ui/button";
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

interface EventSectionProps {
  status: CalendarEvent['status'] | 'done and dusted';
  events: CalendarEvent[];
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
}

export function EventSection({ status, events, onStatusChange }: EventSectionProps) {
  const [isOpen, setIsOpen] = useState(status !== 'done and dusted');

  if (!events.length) return null;

  const sectionIcon = getStatusIcon(status === 'done and dusted' ? 'invoiced' : status);
  const isDoneAndDusted = status === 'done and dusted';

  const getStatusText = (status: string) => {
    return `${status.charAt(0).toUpperCase()}${status.slice(1)} (${events.length})`;
  };

  const handleConfirmAll = () => {
    events.forEach(event => {
      onStatusChange(event, 'confirmed');
    });
  };

  const handleInvoiceReadyAll = () => {
    events.forEach(event => {
      onStatusChange(event, 'invoice ready');
    });
  };

  const content = (
    <div className="space-y-2">
      {events.map((event) => (
        <EventCard
          key={`${event.date}-${event.name}`}
          event={event}
          onStatusChange={onStatusChange}
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
          {content}
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
        {status === 'proposed' && events.length > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleConfirmAll}
          >
            Confirm all
          </Button>
        )}
        {status === 'confirmed' && events.length > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleInvoiceReadyAll}
          >
            Invoice ready all
          </Button>
        )}
      </div>
      {content}
    </div>
  );
}