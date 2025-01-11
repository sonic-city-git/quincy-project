import { Button } from "@/components/ui/button";
import { CalendarEvent } from "@/types/events";
import { getStatusIcon } from "@/utils/eventFormatters";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EventStatusManagerProps {
  status: string;
  events: CalendarEvent[];
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  isCancelled: boolean;
}

export function EventStatusManager({ status, events, onStatusChange, isCancelled }: EventStatusManagerProps) {
  const handleStatusChangeAll = (newStatus: CalendarEvent['status']) => {
    events.forEach(event => {
      onStatusChange(event, newStatus);
    });
  };

  if (events.length === 0 || isCancelled) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          Manage all
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleStatusChangeAll('proposed')}
          className="flex items-center gap-2"
        >
          {getStatusIcon('proposed')}
          Proposed
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleStatusChangeAll('confirmed')}
          className="flex items-center gap-2"
        >
          {getStatusIcon('confirmed')}
          Confirmed
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleStatusChangeAll('invoice ready')}
          className="flex items-center gap-2"
        >
          {getStatusIcon('invoice ready')}
          Invoice Ready
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleStatusChangeAll('cancelled')}
          className="flex items-center gap-2"
        >
          {getStatusIcon('cancelled')}
          Cancelled
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}