import { Users } from "lucide-react";
import { CalendarEvent } from "@/types/events";
import { useSyncCrewStatus } from "@/hooks/useSyncCrewStatus";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderCrewIconProps {
  events: CalendarEvent[];
  onSyncPreferredCrew?: () => void;
}

export function HeaderCrewIcon({ events, onSyncPreferredCrew }: HeaderCrewIconProps) {
  // Check first event to see if we need crew at all
  const firstEvent = events[0];
  if (!firstEvent) return null;

  const { hasProjectRoles, isSynced: firstEventSynced, isChecking } = useSyncCrewStatus(firstEvent);

  // Show nothing if there are no project roles
  if (!hasProjectRoles) return null;

  // Check if all events have their crew assigned
  const allEventsSynced = events.every(event => {
    // We don't want to use hooks in a loop, so we'll check the event's roles directly
    const hasAllRolesAssigned = event.project_event_roles?.every(role => role.crew_member_id !== null);
    return hasAllRolesAssigned;
  });
  
  // If all crew is assigned across all events, show green icon without dropdown
  if (allEventsSynced) {
    return (
      <div className="flex items-center gap-2">
        <Users className="h-6 w-6 text-green-500" />
      </div>
    );
  }

  // Show blue icon with dropdown for unassigned crew
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          disabled={isChecking}
        >
          <Users className={cn(
            "h-6 w-6",
            "text-blue-500"
          )} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem 
          onClick={onSyncPreferredCrew}
          className="flex items-center gap-2"
        >
          Sync preferred crew
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}