import { EventStatusManager } from "../EventStatusManager";
import { CalendarEvent, EventType } from "@/types/events";
import { getStatusIcon } from "@/utils/eventFormatters";
import { EventSectionHeaderGrid } from "./EventSectionHeaderGrid";
import { Package, Users } from "lucide-react";
import { formatPrice } from "@/utils/priceFormatters";

interface EventSectionHeaderProps {
  title: string;
  eventType?: EventType;
  events?: CalendarEvent[];
  onStatusChange?: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
}

export function EventSectionHeader({ 
  title, 
  eventType,
  events = [],
  onStatusChange 
}: EventSectionHeaderProps) {
  const isCancelled = title.toLowerCase() === 'cancelled';
  const iconClasses = "h-6 w-6 flex-shrink-0";

  // Calculate total revenue for the section
  const totalRevenue = events.reduce((sum, event) => sum + (event.revenue || 0), 0);

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
        <div className="col-span-1 flex items-center">
          {eventType?.needs_equipment && (
            <Package className={`${iconClasses} text-muted-foreground`} />
          )}
        </div>
        
        {/* Crew icon column */}
        <div className="col-span-1 flex items-center">
          {eventType?.needs_crew && (
            <Users className={`${iconClasses} text-muted-foreground`} />
          )}
        </div>

        {/* Event type column */}
        <div className="col-span-1" />

        {/* Revenue column */}
        <div className="col-span-1 text-right font-medium text-muted-foreground">
          {formatPrice(totalRevenue)}
        </div>

        {/* Status manager column - now second to last */}
        <div className="col-span-1 flex justify-end">
          {onStatusChange && (
            <EventStatusManager
              status={title.toLowerCase()}
              events={events}
              onStatusChange={onStatusChange}
              isCancelled={isCancelled}
            />
          )}
        </div>

        {/* Empty column for edit button alignment */}
        <div className="col-span-1" />
      </EventSectionHeaderGrid>
    </div>
  );
}