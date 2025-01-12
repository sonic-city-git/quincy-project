import { CalendarEvent } from "@/types/events";
import { EventStatusManager } from "../EventStatusManager";
import { EventSectionHeaderGrid } from "./EventSectionHeaderGrid";
import { Package, Users } from "lucide-react";
import { formatRevenue } from "@/utils/priceFormatters";

interface EventSectionHeaderProps {
  title: string;
  events: CalendarEvent[];
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  isCancelled?: boolean;
}

export function EventSectionHeader({ 
  title, 
  events,
  onStatusChange,
  isCancelled = false
}: EventSectionHeaderProps) {
  const totalRevenue = events.reduce((sum, event) => sum + (event.revenue || 0), 0);
  const hasEquipment = events.some(event => event.type.needs_equipment);
  const hasCrew = events.some(event => event.type.needs_crew);

  return (
    <div className="flex items-center justify-between py-2 px-3">
      <EventSectionHeaderGrid>
        <div className="text-sm font-medium text-muted-foreground">
          {title}
        </div>
        <div />
        <div className="flex items-center gap-2">
          {hasEquipment && (
            <Package className="h-4 w-4 text-muted-foreground" />
          )}
          {hasCrew && (
            <Users className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div />
        <div />
        <div />
        <div />
        <div className="text-sm font-medium text-muted-foreground text-right">
          {formatRevenue(totalRevenue)}
        </div>
        <div />
        <div className="flex justify-end">
          <EventStatusManager
            status={events[0]?.status || 'proposed'}
            events={events}
            onStatusChange={onStatusChange}
            isCancelled={isCancelled}
          />
        </div>
      </EventSectionHeaderGrid>
    </div>
  );
}