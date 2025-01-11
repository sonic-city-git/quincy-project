import { CalendarEvent } from "@/types/events";
import { getStatusIcon, getStatusText } from "@/utils/eventFormatters";
import { EventCard } from "./EventCard";
import { Brush, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface EventSectionProps {
  status: string;
  events: CalendarEvent[];
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
}

export function EventSection({ status, events, onStatusChange }: EventSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (events.length === 0) return null;
  
  const isDoneAndDusted = status === "done and dusted";
  
  const sectionIcon = isDoneAndDusted ? (
    <Brush className="h-5 w-5 text-muted-foreground" />
  ) : (
    getStatusIcon(status)
  );

  const content = (
    <div className="grid gap-3">
      {events.map(event => (
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
      <div className="flex items-center gap-2">
        {sectionIcon}
        <h3 className="text-lg font-semibold">{getStatusText(status)}</h3>
      </div>
      {content}
    </div>
  );
}