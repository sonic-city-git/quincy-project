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
  event: CalendarEvent;
  onSyncPreferredCrew?: () => void;
}

export function HeaderCrewIcon({ event, onSyncPreferredCrew }: HeaderCrewIconProps) {
  const { hasProjectRoles, isSynced, isChecking } = useSyncCrewStatus(event);

  // Show nothing if there are no project roles
  if (!hasProjectRoles) return null;
  
  // If all crew is assigned, show green icon without dropdown
  if (isSynced) {
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