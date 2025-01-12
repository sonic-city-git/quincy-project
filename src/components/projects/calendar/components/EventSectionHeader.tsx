import { Package, Users } from "lucide-react";
import { EventType } from "@/types/events";
import { EventStatusManager } from "../EventStatusManager";
import { CalendarEvent } from "@/types/events";
import { getStatusIcon } from "@/utils/eventFormatters";
import { EventSectionHeaderGrid } from "./EventSectionHeaderGrid";

interface EventSectionHeaderProps {
  title: string;
  eventCount: number;
  eventType?: EventType;
  events?: CalendarEvent[];
  onStatusChange?: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
}

export function EventSectionHeader({ 
  title, 
  eventCount, 
  eventType,
  events = [],
  onStatusChange 
}: EventSectionHeaderProps) {
  const isCancelled = title.toLowerCase() === 'cancelled';

  return (
    <div className="border-b border-border pb-2">
      <EventSectionHeaderGrid>
        <div className="flex items-center gap-2">
          {getStatusIcon(title.toLowerCase() as CalendarEvent['status'])}
          <h3 className="text-lg font-semibold">{title}</h3>
          <span className="text-sm text-muted-foreground">({eventCount})</span>
        </div>
        
        {/* Empty space for event name */}
        <div className="col-span-1" />
        
        {/* Icons column alignment */}
        <div className="flex items-center justify-center">
          {eventType?.needs_equipment && (
            <Package className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center justify-center">
          {eventType?.needs_crew && (
            <Users className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        
        {/* Empty space for event type */}
        <div className="col-span-1" />
        
        {/* Empty space for name */}
        <div className="col-span-1" />
        
        {/* Empty space for revenue */}
        <div className="col-span-1" />
        
        {/* Status manager alignment */}
        <div className="flex justify-end">
          {onStatusChange && (
            <EventStatusManager
              status={title.toLowerCase()}
              events={events}
              onStatusChange={onStatusChange}
              isCancelled={isCancelled}
            />
          )}
        </div>
      </EventSectionHeaderGrid>
    </div>
  );
}