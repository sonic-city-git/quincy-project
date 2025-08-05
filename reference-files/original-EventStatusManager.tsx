import { Button } from "@/components/ui/button";
import { CalendarEvent } from "@/types/events";
import { getStatusIcon } from "@/utils/eventFormatters";
import { Settings2 } from "lucide-react";
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
          variant="ghost"
          size="icon"
          className="h-10 w-10"
        >
          <Settings2 className="h-6 w-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleStatusChangeAll('proposed')}
          className="flex items-center gap-2"
        >
          <div className="h-6 w-6">
            {getStatusIcon('proposed')}
          </div>
          Proposed
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleStatusChangeAll('confirmed')}
          className="flex items-center gap-2"
        >
          <div className="h-6 w-6">
            {getStatusIcon('confirmed')}
          </div>
          Confirmed
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleStatusChangeAll('invoice ready')}
          className="flex items-center gap-2"
        >
          <div className="h-6 w-6">
            {getStatusIcon('invoice ready')}
          </div>
          Invoice Ready
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleStatusChangeAll('cancelled')}
          className="flex items-center gap-2"
        >
          <div className="h-6 w-6">
            {getStatusIcon('cancelled')}
          </div>
          Cancelled
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}