import { CalendarEvent } from "@/types/events";
import { EVENT_COLORS } from "@/constants/eventColors";
import { Card } from "@/components/ui/card";
import { EventCard as EventCardContent } from "./components/EventCard";
import { EventCardIcons } from "./components/EventCardIcons";
import { formatPrice } from "@/utils/priceFormatters";
import { EventCardGrid } from "./components/EventCardGrid";
import { EventCardStatus } from "./components/EventCardStatus";
import { EventActions } from "./components/EventActions";

interface EventCardProps {
  event: CalendarEvent;
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit: ((event: CalendarEvent) => void) | undefined;
  sectionTitle?: string;
}

export function EventCard({ event, onStatusChange, onEdit, sectionTitle }: EventCardProps) {
  const isEditingDisabled = (status: string) => {
    return ['cancelled', 'invoice ready'].includes(status);
  };

  return (
    <Card 
      key={`${event.date}-${event.name}`} 
      className={`p-2 transition-colors mb-1.5 ${EventCardStatus({ status: event.status })}`}
    >
      <EventCardGrid>
        <EventCardContent event={event} />
        
        <EventCardIcons
          event={event}
          isEditingDisabled={isEditingDisabled(event.status)}
          sectionTitle={sectionTitle}
        />

        <div className="flex items-center px-1.5">
          <span 
            className={`text-sm px-1.5 py-0.5 rounded-md bg-opacity-75 ${EVENT_COLORS[event.type.name]}`}
          >
            {event.type.name}
          </span>
        </div>

        <div className="flex items-center justify-end text-sm">
          {formatPrice(event.total_price)}
        </div>

        <EventActions
          event={event}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
          isEditingDisabled={isEditingDisabled(event.status)}
        />
      </EventCardGrid>
    </Card>
  );
}