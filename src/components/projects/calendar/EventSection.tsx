import { CalendarEvent } from "@/types/events";
import { EventCard } from "./EventCard";
import { EventSectionHeader } from "./components/EventSectionHeader";
import { EventSectionContent } from "./components/EventSectionContent";
import { formatPrice } from "@/utils/priceFormatters";

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
  const totalRevenue = events.reduce((sum, event) => sum + (event.revenue || 0), 0);
  const totalPrice = events.reduce((sum, event) => sum + (event.total_price || 0), 0);

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
            <div className="text-sm text-muted-foreground">
              <div className="flex justify-between items-center">
                <span>Equipment Total:</span>
                <span>{formatPrice(totalEquipmentPrice)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span>Revenue Total:</span>
                <span>{formatPrice(totalRevenue)}</span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-700 font-medium text-foreground">
                <span>Section Total:</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
            </div>
          </div>
        )}
      </EventSectionContent>
    </div>
  );
}