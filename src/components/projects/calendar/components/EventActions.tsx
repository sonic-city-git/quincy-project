import { CalendarEvent } from "@/types/events";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";
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
  onEdit?: (event: CalendarEvent) => void;
  isEditingDisabled: boolean;
}

export function EventActions({ 
  event, 
  onStatusChange, 
  onEdit,
  isEditingDisabled 
}: EventActionsProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit && !isEditingDisabled) {
      onEdit(event);
    }
  };

  return (
    <>
      {/* Status manager column */}
      <div className="flex items-center justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
            >
              <div className="h-6 w-6">
                {getStatusIcon(event.status)}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => onStatusChange(event, 'proposed')}
              className="flex items-center gap-2"
            >
              <div className="h-6 w-6">
                {getStatusIcon('proposed')}
              </div>
              Proposed
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onStatusChange(event, 'confirmed')}
              className="flex items-center gap-2"
            >
              <div className="h-6 w-6">
                {getStatusIcon('confirmed')}
              </div>
              Confirmed
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onStatusChange(event, 'invoice ready')}
              className="flex items-center gap-2"
            >
              <div className="h-6 w-6">
                {getStatusIcon('invoice ready')}
              </div>
              Invoice Ready
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onStatusChange(event, 'cancelled')}
              className="flex items-center gap-2"
            >
              <div className="h-6 w-6">
                {getStatusIcon('cancelled')}
              </div>
              Cancelled
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Edit button column */}
      <div className="flex items-center justify-center">
        {onEdit && !isEditingDisabled && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            className="h-10 w-10 text-muted-foreground hover:text-foreground"
          >
            <Edit2 className="h-6 w-6" />
          </Button>
        )}
      </div>
    </>
  );
}