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
  const isInvoiceReady = title.toLowerCase() === 'invoice ready';
  const isDoneAndDusted = title.toLowerCase() === 'done and dusted';
  const totalRevenue = events.reduce((sum, event) => sum + (event.revenue || 0), 0);

  // Use a simpler layout for Done and Dusted section
  if (isDoneAndDusted) {
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 flex items-center justify-center">
              {getStatusIcon(title.toLowerCase() as CalendarEvent['status'])}
            </div>
            <div>{title}</div>
          </div>
          <div className="text-right font-medium text-muted-foreground">
            {formatPrice(totalRevenue)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-zinc-800 rounded-lg bg-zinc-900/50 backdrop-blur-sm p-3 mb-4">
      <EventSectionHeaderGrid>
        <div className="col-span-2 flex items-center gap-2 justify-start">
          <div className="h-6 w-6 flex items-center justify-center">
            {getStatusIcon(title.toLowerCase() as CalendarEvent['status'])}
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        
        {/* Empty space for location icon */}
        <div />
        
        {/* Empty space */}
        <div />
        
        {/* Equipment icon column */}
        <div className="flex items-center justify-center">
          {!isCancelled && !isInvoiceReady && eventType?.needs_equipment && (
            <Package className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        
        {/* Crew icon column */}
        <div className="flex items-center justify-center">
          {!isCancelled && !isInvoiceReady && eventType?.needs_crew && (
            <Users className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        {/* Event type column */}
        <div />

        {/* Revenue column */}
        <div className="text-right font-medium text-muted-foreground">
          {formatPrice(totalRevenue)}
        </div>

        {/* Status manager column */}
        <div className="flex justify-center">
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
        <div />
      </EventSectionHeaderGrid>
    </div>
  );
}