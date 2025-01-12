import { CalendarEvent } from "@/types/events";
import { Card } from "@/components/ui/card";
import { Calendar, Edit, MapPin, Package, Users } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getStatusIcon } from "@/utils/eventFormatters";
import { EVENT_COLORS } from "@/constants/eventColors";

interface EventCardProps {
  event: CalendarEvent;
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit?: (event: CalendarEvent) => void;
}

export function EventCard({ event, onStatusChange, onEdit }: EventCardProps) {
  const hasEquipment = event.equipment && event.equipment.length > 0;

  const handleEquipmentOption = (option: 'assign' | 'custom') => {
    console.log('Equipment option selected:', option, event);
    // TODO: Implement the actual functionality for each option
  };

  return (
    <Card key={`${event.date}-${event.name}`} className="p-4">
      <div className="grid grid-cols-[120px_1fr_40px_40px_1fr_auto] gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {format(event.date, 'dd.MM.yy')}
          </span>
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-start">
            <span className="font-medium text-base">
              {event.name}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center">
          {event.type.needs_equipment && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0"
                >
                  <Package 
                    className={`h-6 w-6 ${hasEquipment ? 'text-green-500' : 'text-muted-foreground'}`}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handleEquipmentOption('assign')}>
                  Assign and track project equipment
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEquipmentOption('custom')}>
                  Create custom equipment list
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center justify-center">
          {event.type.needs_crew && (
            <Users className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        <div className="flex items-center">
          <span 
            className={`text-sm px-2 py-1 rounded-md ${EVENT_COLORS[event.type.name]}`}
          >
            {event.type.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
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
      </div>
    </Card>
  );
}