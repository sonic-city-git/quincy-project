import { CalendarEvent, EventType } from "@/types/events";
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

// Utility function to get event type color styling for badges
export function getEventTypeColorStyle(eventType: EventType): string {
  // Use the color from the event type or fall back to EVENT_COLORS mapping
  const typeColor = eventType.color || EVENT_COLORS[eventType.name];
  
  if (!typeColor) return 'bg-muted text-muted-foreground';
  
  // Convert background classes to badge styling with proper contrast
  const colorMap: Record<string, string> = {
    'bg-green-500': 'bg-green-500/10 text-green-700 border border-green-500/20',
    'bg-blue-500': 'bg-blue-500/10 text-blue-700 border border-blue-500/20',
    'bg-yellow-500': 'bg-yellow-500/10 text-yellow-700 border border-yellow-500/20',
    'bg-pink-500': 'bg-pink-500/10 text-pink-700 border border-pink-500/20',
    'bg-red-500': 'bg-red-500/10 text-red-700 border border-red-500/20',
    'bg-orange-500': 'bg-orange-500/10 text-orange-700 border border-orange-500/20',
    'bg-purple-500': 'bg-purple-500/10 text-purple-700 border border-purple-500/20',
    'bg-indigo-500': 'bg-indigo-500/10 text-indigo-700 border border-indigo-500/20',
  };
  
  return colorMap[typeColor] || 'bg-muted text-muted-foreground';
}

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
  
  // Get event type color styling
  const getTypeColorStyle = () => {
    return getEventTypeColorStyle(event.type);
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
          <div className="hidden md:flex items-center px-1">
            <span className={cn(
              'inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold',
              'transition-all duration-200 tracking-wide',
              getTypeColorStyle()
            )}>
              {event.type.name}
            </span>
          </div>

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