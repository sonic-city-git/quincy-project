import { CalendarEvent } from "@/types/events";
import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";
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
}

export function EventCard({ event, onStatusChange }: EventCardProps) {
  const getColorStyles = (color: string) => {
    return {
      backgroundColor: `${color}80`,  // 80 in hex is 50% opacity
      color: '#FFFFFF'  // White text, fully opaque
    };
  };

  return (
    <Card key={`${event.date}-${event.name}`} className="p-4">
      <div className="grid grid-cols-[160px_1fr_auto_auto_auto] items-center gap-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {format(event.date, 'dd.MM.yyyy')}
          </span>
        </div>
        <div className="flex items-center">
          <span 
            className="font-medium text-base truncate px-3 py-1 rounded-md"
            style={getColorStyles(event.type.color)}
          >
            {event.name}
          </span>
        </div>
        <div>
          <span 
            className="text-sm px-3 py-1 rounded-full"
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
      </div>
    </Card>
  );
}