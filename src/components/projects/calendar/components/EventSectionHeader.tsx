import { Package, Users } from "lucide-react";
import { EventStatusManager } from "../EventStatusManager";
import { CalendarEvent, EventType } from "@/types/events";
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
        <div className="col-span-2 flex items-center gap-2">
          {getStatusIcon(title.toLowerCase() as CalendarEvent['status'])}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        
        {/* Empty space before icons */}
        <div className="col-span-1" />
        
        {/* Icons column alignment */}
        <div className="flex items-center justify-center">
          {eventType?.needs_equipment && (
            <Package className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center justify-center">
          {eventType?.needs_crew && (
            <Users className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        
        {/* Empty space for revenue */}
        <div className="col-span-1" />

        {/* Status manager in second to last column */}
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

        {/* Empty last column */}
        <div className="col-span-1" />
      </EventSectionHeaderGrid>
    </div>
  );
}