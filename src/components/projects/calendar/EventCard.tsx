import { CalendarEvent } from "@/types/events";
import { EVENT_COLORS } from "@/constants/eventColors";
import { Card } from "@/components/ui/card";
import { EventCard as EventCardContent } from "./components/EventCard";
import { EventCardIcons } from "./components/EventCardIcons";
import { formatPrice } from "@/utils/priceFormatters";
import { EventCardGrid } from "./components/EventCardGrid";
import { EventCardStatus } from "./components/EventCardStatus";
import { EventActions } from "./components/EventActions";
import { TooltipProvider } from "@/components/ui/tooltip";

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
    <TooltipProvider>
      <Card 
        key={`${event.date}-${event.name}`} 
        className={`p-2 transition-colors mb-1.5 ${EventCardStatus({ status: event.status })}`}
      >
        <EventCardGrid>
          <EventCardContent event={event} onEdit={onEdit} />
          
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

          <div className="flex items-center justify-center">
            <EventActions
              event={event}
              onStatusChange={onStatusChange}
              isEditingDisabled={isEditingDisabled(event.status)}
            />
          </div>

          <div className="flex items-center justify-end text-sm text-muted-foreground">
            {formatPrice(event.equipment_price)}
          </div>

          <div className="flex items-center justify-end text-sm text-muted-foreground">
            {formatPrice(0)} {/* Crew price - will be implemented later */}
          </div>

          <div className="flex items-center justify-end text-sm font-medium">
            {formatPrice(event.total_price)}
          </div>
        </EventCardGrid>
      </Card>
    </TooltipProvider>
  );
}