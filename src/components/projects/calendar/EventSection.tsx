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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const isCancelled = status === 'cancelled';

  const getStatusText = (status: string) => {
    return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
  };

  const handleStatusChangeAll = (newStatus: CalendarEvent['status']) => {
    events.forEach(event => {
      onStatusChange(event, newStatus);
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
        {events.length > 0 && !isCancelled && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                Manage all
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => handleStatusChangeAll('proposed')}
                className="flex items-center gap-2"
              >
                {getStatusIcon('proposed')}
                Proposed
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleStatusChangeAll('confirmed')}
                className="flex items-center gap-2"
              >
                {getStatusIcon('confirmed')}
                Confirmed
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleStatusChangeAll('invoice ready')}
                className="flex items-center gap-2"
              >
                {getStatusIcon('invoice ready')}
                Invoice Ready
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleStatusChangeAll('cancelled')}
                className="flex items-center gap-2"
              >
                {getStatusIcon('cancelled')}
                Cancelled
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {content}
    </div>
  );
}