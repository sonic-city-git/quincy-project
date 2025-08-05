import { CalendarEvent } from "@/types/events";
import { EventCard } from "./EventCard";
import { EventGrid, EventGridColumns } from "./layout/EventGrid";
import { EventContent } from "./layout/EventContent";
import { EventStatus } from "./components/EventStatus";
import { EventEquipment } from "./components/EventEquipment";
import { EventCrew } from "./components/EventCrew";
import { formatPrice } from "@/utils/priceFormatters";
import { cn } from "@/lib/utils";

interface EventSectionProps {
  title: string;
  events: CalendarEvent[];
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit: ((event: CalendarEvent) => void) | undefined;
  hideEdit?: boolean;
  hideHeader?: boolean;
  variant?: 'warning' | 'success' | 'info' | 'critical' | 'operational';
}

export function EventSection({ 
  title, 
  events, 
  onStatusChange, 
  onEdit,
  hideEdit,
  hideHeader,
  variant = 'info'
}: EventSectionProps) {
  const eventType = events[0]?.type;
  
  // Calculate total prices for the section
  const totalEquipmentPrice = events.reduce((sum, event) => {
    return sum + (event.equipment_price || 0);
  }, 0);
  
  const totalCrewPrice = events.reduce((sum, event) => {
    return sum + (event.crew_price || 0);
  }, 0);
  
  const totalPrice = events.reduce((sum, event) => {
    return sum + (event.total_price || 0);
  }, 0);

  // Get the appropriate total label based on the section title
  const getTotalLabel = () => {
    const status = title.toLowerCase();
    if (status === 'confirmed') return 'Confirmed Total';
    if (status === 'proposed') return 'Proposed Total';
    if (status === 'invoice ready') return 'Ready Total';
    if (status === 'cancelled') return 'Cancelled Total';
    return 'Section Total';
  };

  return (
    <div>
      {!hideHeader && (
        <EventSectionHeader 
          title={title}
          events={events}
          variant={variant}
          onStatusChange={onStatusChange}
        />
      )}
      
      <EventContent variant="list" spacing="sm">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onStatusChange={onStatusChange}
            onEdit={hideEdit ? undefined : onEdit}
            sectionTitle={title}
          />
        ))}
        
        {/* Enhanced Summary Row - show for all sections with totals */}
        {events.length > 0 && (totalEquipmentPrice > 0 || totalCrewPrice > 0 || totalPrice > 0) && (
          <EventSectionSummary
            title={getTotalLabel()}
            totalEquipment={totalEquipmentPrice}
            totalCrew={totalCrewPrice}
            totalPrice={totalPrice}
            eventCount={events.length}
            variant={variant}
          />
        )}
      </EventContent>
    </div>
  );
}

/**
 * Professional section header with design system integration
 */
function EventSectionHeader({ 
  title, 
  events, 
  variant, 
  onStatusChange 
}: {
  title: string;
  events: CalendarEvent[];
  variant: 'warning' | 'success' | 'info' | 'critical' | 'operational';
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
}) {
  const eventType = events[0]?.type;
  
  return (
    <div className={cn(
      'flex items-center justify-between p-4 border-b border-border/20',
      'bg-gradient-to-r from-muted/10 to-muted/30'
    )}>
      <div className="flex items-center gap-3">
        <EventStatus
          event={events[0]}
          variant="icon"
          onStatusChange={onStatusChange}
        />
        <div>
          <h3 className="text-xl font-bold tracking-tight">{title}</h3>
          <p className="text-sm text-muted-foreground/80 font-medium">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Equipment section actions */}
        {eventType?.needs_equipment && (
          <EventEquipment
            events={events}
            variant="section"
          />
        )}
        
        {/* Crew section actions */}
        {eventType?.needs_crew && (
          <EventCrew
            events={events}
            variant="section"
          />
        )}
        
        {/* Bulk status actions */}
        <EventStatus
          events={events}
          variant="manager"
          onStatusChange={onStatusChange}
        />
      </div>
    </div>
  );
}

/**
 * Professional summary row for section totals
 */
function EventSectionSummary({
  title,
  totalEquipment,
  totalCrew,
  totalPrice,
  eventCount,
  variant = 'info'
}: {
  title: string;
  totalEquipment: number;
  totalCrew: number;
  totalPrice: number;
  eventCount: number;
  variant?: 'warning' | 'success' | 'info' | 'critical' | 'operational';
}) {
  // Get status pattern for enhanced styling
  const getStatusPattern = () => {
    switch (variant) {
      case 'warning': return { bg: 'bg-gradient-to-r from-orange-50/20 to-orange-100/20', border: 'border-orange-200/30', accent: 'text-orange-600' };
      case 'success': return { bg: 'bg-gradient-to-r from-green-50/20 to-green-100/20', border: 'border-green-200/30', accent: 'text-green-600' };
      case 'info': return { bg: 'bg-gradient-to-r from-blue-50/20 to-blue-100/20', border: 'border-blue-200/30', accent: 'text-blue-600' };
      case 'critical': return { bg: 'bg-gradient-to-r from-red-50/20 to-red-100/20', border: 'border-red-200/30', accent: 'text-red-600' };
      default: return { bg: 'bg-gradient-to-r from-muted/10 to-muted/20', border: 'border-border/30', accent: 'text-muted-foreground' };
    }
  };

  const pattern = getStatusPattern();

  return (
    <div className={cn(
      'mt-4 p-4 rounded-lg border-l-4 shadow-sm',
      pattern.bg,
      pattern.border
    )}>
      <EventGrid variant="card">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-current opacity-60" />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="font-bold text-foreground tracking-wide">
            {title}
          </div>
          <div className={cn("text-xs font-medium px-2 py-1 rounded-md bg-muted/30", pattern.accent)}>
            {eventCount} event{eventCount !== 1 ? 's' : ''}
          </div>
        </div>
        
        <div className="col-span-6" /> {/* Icon columns */}
        
        <EventGridColumns.Price variant="muted" className="font-semibold">
          {formatPrice(totalEquipment)}
        </EventGridColumns.Price>
        
        <EventGridColumns.Price variant="muted" className="font-semibold">
          {formatPrice(totalCrew)}
        </EventGridColumns.Price>
        
        <EventGridColumns.Price variant="total" className="font-bold text-lg">
          {formatPrice(totalPrice)}
        </EventGridColumns.Price>
      </EventGrid>
    </div>
  );
}