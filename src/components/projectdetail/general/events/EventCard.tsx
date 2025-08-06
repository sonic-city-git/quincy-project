import { CalendarEvent } from "@/types/events";
import { EVENT_COLORS } from "@/constants/eventColors";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/utils/priceFormatters";
import { EventGrid, EventGridColumns } from "./layout/EventGrid";
import { EventEquipment } from "./components/EventEquipment";
import { EventCrew } from "./components/EventCrew";
import { EventStatus } from "./components/EventStatus";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Calendar, MapPin } from "lucide-react";
import { formatDisplayDate } from "@/utils/dateFormatters";
import { cn } from "@/lib/utils";
import { COMPONENT_CLASSES, STATUS_PATTERNS } from "@/design-system";
import { useEventSyncStatus } from "@/hooks/useConsolidatedSyncStatus";

interface EventCardProps {
  event: CalendarEvent;
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit: ((event: CalendarEvent) => void) | undefined;
  sectionTitle?: string;
}

export function EventCard({ event, onStatusChange, onEdit, sectionTitle }: EventCardProps) {
  const isEditingDisabled = ['cancelled', 'invoice ready', 'invoiced'].includes(event.status);
  
  // Get sync status for equipment and crew
  const { isEquipmentSynced, hasProjectEquipment, isCrewSynced, hasProjectRoles } = useEventSyncStatus(event);
  
  // Get status styling using design system
  const getStatusPattern = (status: string) => {
    switch (status) {
      case 'proposed':
        return STATUS_PATTERNS.warning;
      case 'confirmed':
        return STATUS_PATTERNS.success;
      case 'invoice ready':
        return STATUS_PATTERNS.info;
      case 'cancelled':
        return STATUS_PATTERNS.critical;
      default:
        return { bg: 'bg-card', border: 'border-border' };
    }
  };

  const statusPattern = getStatusPattern(event.status);
  
  // Determine location icon status
  const locationStatus = event.location ? 'success' : 'neutral';
  
  // Get event type variant for badge styling
  const getTypeVariant = () => {
    if (event.type.name?.toLowerCase().includes('concert')) return 'primary';
    if (event.type.name?.toLowerCase().includes('festival')) return 'secondary';
    if (event.type.name?.toLowerCase().includes('corporate')) return 'warning';
    return 'default';
  };

  return (
    <TooltipProvider>
      <Card 
        className={cn(
          COMPONENT_CLASSES.card.hover,
          'transition-all duration-200 ease-in-out group',
          statusPattern.bg,
          statusPattern.border && `border-l-4 ${statusPattern.border}`,
          'mb-1 shadow-sm hover:shadow-md'
        )}
      >
        <EventGrid variant="card">
          {/* Date */}
          <EventGridColumns.Date interactive={!!onEdit}>
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">
              {formatDisplayDate(event.date)}
            </span>
          </EventGridColumns.Date>
          
          {/* Event Name & Location */}
          <EventGridColumns.Event 
            interactive={!!onEdit}
            className={cn(onEdit && 'cursor-pointer')}
          >
            <div 
              className="space-y-1"
              onClick={onEdit ? () => onEdit(event) : undefined}
            >
              <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {event.name}
              </h4>
              {event.location && (
                <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  {event.location}
                </p>
              )}
            </div>
          </EventGridColumns.Event>
          
          {/* Event Type Badge - Only on tablet+ to fit mobile grid */}
          <EventGridColumns.Badge variant={getTypeVariant()} className="hidden md:flex">
            {event.type.name}
          </EventGridColumns.Badge>

          {/* Variant - Only on tablet+ to fit mobile grid */}
          <div className="text-sm text-muted-foreground/80 font-medium hidden md:block">
            {/* TODO: Add variant field to event data */}
            -
          </div>

          {/* Location Status Icon */}
          <EventGridColumns.Icon status={locationStatus}>
            <MapPin className="h-5 w-5" />
          </EventGridColumns.Icon>

          {/* Equipment Status */}
          <EventGridColumns.Icon>
            <EventEquipment
              event={event}
              variant="icon"
              disabled={isEditingDisabled}
              isSynced={isEquipmentSynced}
              hasProjectEquipment={hasProjectEquipment}
            />
          </EventGridColumns.Icon>

          {/* Crew Status */}
          <EventGridColumns.Icon>
            <EventCrew
              event={event}
              variant="icon" 
              disabled={isEditingDisabled}
              isSynced={isCrewSynced}
              hasProjectRoles={hasProjectRoles}
            />
          </EventGridColumns.Icon>

          {/* Status Actions */}
          <EventGridColumns.Action>
            <EventStatus
              event={event}
              variant="manager"
              onStatusChange={onStatusChange}
              disabled={isEditingDisabled}
            />
          </EventGridColumns.Action>

          {/* Equipment Price - Hidden until tablet to prioritize Total */}
          <EventGridColumns.Price variant="muted" className="hidden md:flex">
            {formatPrice(event.equipment_price)}
          </EventGridColumns.Price>

          {/* Crew Price - Hidden until tablet to prioritize Total */}
          <EventGridColumns.Price variant="muted" className="hidden md:flex">
            {formatPrice(event.crew_price)}
          </EventGridColumns.Price>

          {/* Total Price - HIGHEST PRIORITY, always visible */}
          <EventGridColumns.Price variant="muted">
            {formatPrice(event.total_price)}
          </EventGridColumns.Price>
        </EventGrid>
      </Card>
    </TooltipProvider>
  );
}