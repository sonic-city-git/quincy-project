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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface HeaderCrewIconProps {
  events: CalendarEvent[];
  onSyncPreferredCrew?: () => void;
}

export function HeaderCrewIcon({ events, onSyncPreferredCrew }: HeaderCrewIconProps) {
  // Check first event to see if we need crew at all
  const firstEvent = events[0];
  if (!firstEvent || !firstEvent.type.needs_crew) return null;

  const { hasProjectRoles, isSynced: firstEventSynced, isChecking } = useSyncCrewStatus(firstEvent);

  // Get crew assignments for all events
  const { data: eventRoles } = useQuery({
    queryKey: ['event-roles', events.map(e => e.id)],
    queryFn: async () => {
      const { data } = await supabase
        .from('project_event_roles')
        .select('event_id, crew_member_id')
        .in('event_id', events.map(e => e.id));
      return data || [];
    },
    enabled: events.length > 0
  });

  // Show nothing if there are no project roles
  if (!hasProjectRoles) return null;

  // Check if all events have their crew assigned
  const allEventsSynced = events.every(event => {
    const eventAssignments = eventRoles?.filter(role => role.event_id === event.id) || [];
    return eventAssignments.every(role => role.crew_member_id !== null);
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