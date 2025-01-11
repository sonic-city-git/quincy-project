import { CalendarEvent } from "@/types/events";
import { Card } from "@/components/ui/card";
import { Calendar, Edit, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getStatusIcon, formatRevenue } from "@/utils/eventFormatters";

interface EventCardProps {
  event: CalendarEvent;
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit?: (event: CalendarEvent) => void;
}

export function EventCard({ event, onStatusChange, onEdit }: EventCardProps) {
  const getColorStyles = (color: string) => {
    return {
      backgroundColor: `${color}D9`,  // D9 in hex is 85% opacity
      color: '#FFFFFF'  // White text, fully opaque
    };
  };

  return (
    <Card key={`${event.date}-${event.name}`} className="p-4">
      <div className="grid grid-cols-[120px_1fr_auto_auto_auto_auto] items-center gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {format(event.date, 'dd.MM.yy')}
          </span>
        </div>
        <div className="flex flex-col">
          <span 
            className="font-medium text-base truncate px-3 py-1 rounded-md"
            style={getColorStyles(event.type.color)}
          >
            {event.name}
          </span>
          {event.location && (
            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{event.location}</span>
            </div>
          )}
        </div>
        <div>
          <span 
            className="text-sm px-3 py-1 rounded-md"
            style={getColorStyles(event.type.color)}
          >
            {event.type.name}
          </span>
        </div>
        <div className="text-sm text-muted-foreground font-medium">
          {formatRevenue(event.revenue)}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="flex items-center gap-2"
            >
              {getStatusIcon(event.status)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => onStatusChange(event, 'proposed')}
              className="flex items-center gap-2"
            >
              {getStatusIcon('proposed')}
              Proposed
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onStatusChange(event, 'confirmed')}
              className="flex items-center gap-2"
            >
              {getStatusIcon('confirmed')}
              Confirmed
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onStatusChange(event, 'invoice ready')}
              className="flex items-center gap-2"
            >
              {getStatusIcon('invoice ready')}
              Invoice Ready
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onStatusChange(event, 'cancelled')}
              className="flex items-center gap-2"
            >
              {getStatusIcon('cancelled')}
              Cancelled
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(event)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}