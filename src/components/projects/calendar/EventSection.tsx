import { CalendarEvent } from "@/types/events";
import { EventCard } from "./EventCard";
import { EventSectionHeader } from "./components/EventSectionHeader";
import { EventSectionContent } from "./components/EventSectionContent";
import { formatPrice } from "@/utils/priceFormatters";
import { EventCardGrid } from "./components/EventCardGrid";

interface EventSectionProps {
  title: string;
  events: CalendarEvent[];
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit: ((event: CalendarEvent) => void) | undefined;
  hideEdit?: boolean;
  hideHeader?: boolean;
}

export function EventSection({ 
  title, 
  events, 
  onStatusChange, 
  onEdit,
  hideEdit,
  hideHeader 
}: EventSectionProps) {
  const eventType = events[0]?.type;
  
  // Calculate total prices for the section
  const totalEquipmentPrice = events.reduce((sum, event) => sum + (event.equipment_price || 0), 0);
  const totalCrewPrice = 0; // TODO: Implement crew price calculation
  const totalPrice = events.reduce((sum, event) => sum + (event.total_price || 0), 0);

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
    <div className="mb-8">
      {!hideHeader && (
        <EventSectionHeader 
          title={title}
          eventType={eventType}
          events={events}
          onStatusChange={onStatusChange}
        />
      )}
      <EventSectionContent
        events={events}
        onStatusChange={onStatusChange}
        onEdit={onEdit}
      >
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onStatusChange={onStatusChange}
            onEdit={hideEdit ? undefined : onEdit}
            sectionTitle={title}
          />
        ))}
        
        {/* Price Summary */}
        {events.length > 1 && (
          <div className="mt-4 p-3 bg-zinc-800/50 rounded-md">
            <EventCardGrid>
              <div className="col-span-8" /> {/* Span the first 8 columns */}
              <div className="flex justify-end text-sm text-muted-foreground">
                {formatPrice(totalEquipmentPrice)}
              </div>
              <div className="flex justify-end text-sm text-muted-foreground">
                {formatPrice(totalCrewPrice)}
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground mb-1">{getTotalLabel()}</span>
                <span className="text-sm font-medium text-foreground">
                  {formatPrice(totalPrice)}
                </span>
              </div>
            </EventCardGrid>
          </div>
        )}
      </EventSectionContent>
    </div>
  );
}