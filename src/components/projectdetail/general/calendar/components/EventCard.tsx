import { CalendarEvent } from "@/types/events";
import { EVENT_COLORS } from "@/constants/eventColors";
import { Card } from "@/components/ui/card";
// Remove circular import - EventCardContent will be inline
import { EventCardIcons } from "./EventCardIcons";
import { formatPrice } from "@/utils/priceFormatters";
import { EventCardGrid } from "./EventCardGrid";
import { EventCardStatus } from "./EventCardStatus";
import { EventActions } from "./EventActions";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "lucide-react";
import { formatDisplayDate } from "@/utils/dateFormatters";

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

  // Get event type details including crew_rate_multiplier and needs_crew
  const { data: eventType } = useQuery({
    queryKey: ['event_type', event.type.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_types')
        .select('*')
        .eq('id', event.type.id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Get crew roles and their costs for this event
  const { data: eventRoles } = useQuery({
    queryKey: ['event_roles', event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_event_roles')
        .select(`
          *,
          crew_roles (
            name
          ),
          crew_members (
            name
          )
        `)
        .eq('event_id', event.id);
      
      if (error) throw error;
    
      return data;
    },
    enabled: eventType?.needs_crew
  });

  return (
    <TooltipProvider>
      <Card 
        key={`${event.date}-${event.name}`} 
        className={`p-2 transition-colors mb-1.5 ${EventCardStatus({ status: event.status })}`}
      >
        <EventCardGrid>
          {/* Date column */}
          <div 
            className="flex items-center gap-2 hover:text-primary cursor-pointer select-none" 
            onClick={() => onEdit?.(event)}
          >
            <Calendar className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {formatDisplayDate(event.date)}
            </span>
          </div>
          
          {/* Name column */}
          <div 
            className="flex flex-col justify-center hover:text-primary cursor-pointer select-none" 
            onClick={() => onEdit?.(event)}
          >
            <div className="flex items-center">
              <span className="font-medium text-base truncate">
                {event.name}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center text-muted-foreground">
                <span className="text-sm truncate">{event.location}</span>
              </div>
            )}
          </div>
          
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
            {formatPrice(event.crew_price)}
          </div>

          <div className="flex items-center justify-end text-sm font-medium">
            {formatPrice(event.total_price)}
          </div>
        </EventCardGrid>
      </Card>
    </TooltipProvider>
  );
}