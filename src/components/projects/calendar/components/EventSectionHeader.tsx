import { EventStatusManager } from "../EventStatusManager";
import { CalendarEvent, EventType } from "@/types/events";
import { getStatusIcon } from "@/utils/eventFormatters";
import { EventSectionHeaderGrid } from "./EventSectionHeaderGrid";
import { Package, Users } from "lucide-react";

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
    <div className="border border-zinc-800 rounded-lg bg-zinc-900/50 backdrop-blur-sm p-3 mb-4">
      <EventSectionHeaderGrid>
        <div className="col-span-2 flex items-center gap-2 justify-start">
          {getStatusIcon(title.toLowerCase() as CalendarEvent['status'])}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        
        {/* Empty space */}
        <div className="col-span-2" />
        
        {/* Equipment icon column */}
        <div className="col-span-1">
          {eventType?.needs_equipment && (
            <Package className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        
        {/* Crew icon column */}
        <div className="col-span-1">
          {eventType?.needs_crew && (
            <Users className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {/* Event type column */}
        <div className="col-span-1" />

        {/* Revenue column */}
        <div className="col-span-1" />

        {/* Status manager column */}
        <div className="col-span-2 flex justify-end">
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