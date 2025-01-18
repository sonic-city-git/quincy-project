import { CalendarEvent } from "@/types/events";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getStatusIcon } from "@/utils/eventFormatters";

interface EventActionsProps {
  event: CalendarEvent;
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  isEditingDisabled: boolean;
}

export function EventActions({ 
  event, 
  onStatusChange,
  isEditingDisabled 
}: EventActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <div className="h-5 w-5">
            {getStatusIcon(event.status)}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => onStatusChange(event, 'proposed')}
          className="flex items-center gap-2"
        >
          <div className="h-5 w-5">
            {getStatusIcon('proposed')}
          </div>
          Proposed
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onStatusChange(event, 'confirmed')}
          className="flex items-center gap-2"
        >
          <div className="h-5 w-5">
            {getStatusIcon('confirmed')}
          </div>
          Confirmed
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onStatusChange(event, 'invoice ready')}
          className="flex items-center gap-2"
        >
          <div className="h-5 w-5">
            {getStatusIcon('invoice ready')}
          </div>
          Invoice Ready
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onStatusChange(event, 'cancelled')}
          className="flex items-center gap-2"
        >
          <div className="h-5 w-5">
            {getStatusIcon('cancelled')}
          </div>
          Cancelled
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}