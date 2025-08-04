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
import { useMemo } from "react";

interface HeaderCrewIconProps {
  events: CalendarEvent[];
  onSyncPreferredCrew?: () => void;
}

export function HeaderCrewIcon({ events, onSyncPreferredCrew }: HeaderCrewIconProps) {
  // Always get first event but don't early return (hooks must be called consistently)
  const firstEvent = events[0];

  const { hasProjectRoles, isSynced: firstEventSynced, isChecking } = useSyncCrewStatus(firstEvent);

  // Get crew assignments for all events
  const { data: eventRoles } = useQuery({
    queryKey: ['event-roles', events.map(e => e.id)],
    queryFn: async () => {
      const { data } = await supabase
        .from('project_event_roles')
        .select('event_id, crew_member_id, role_id')
        .in('event_id', events.map(e => e.id));
      return data || [];
    },
    enabled: events.length > 0
  });

  // Check for conflicts in actually assigned crew
  const { data: conflictsData, isLoading: isCheckingConflicts } = useQuery({
    queryKey: ['crew-conflicts', events.map(e => e.id), eventRoles?.map(r => r.crew_member_id).join(',')],
    queryFn: async () => {
      if (!firstEvent?.project_id || !eventRoles?.length) return { hasConflicts: false, conflictCount: 0 };

      try {
        // Get unique assigned crew members across all events
        const assignedCrewIds = [...new Set(
          eventRoles
            .filter(role => role.crew_member_id)
            .map(role => role.crew_member_id)
        )];

        if (!assignedCrewIds.length) {
          return { hasConflicts: false, conflictCount: 0 };
        }

        // Check for conflicts among actually assigned crew on event dates
        // BUT exclude conflicts from events in this same section (not actual conflicts!)
        const { checkCrewConflicts } = await import('@/utils/crewConflictDetection');
        const eventIds = new Set(events.map(e => e.id));
        
        let conflictCount = 0;
        for (const crewMemberId of assignedCrewIds) {
          // Check each event date individually to avoid false positives from same-section assignments
          for (const event of events) {
            // Only check this crew member if they're assigned to this specific event
            const isAssignedToThisEvent = eventRoles?.some(
              er => er.event_id === event.id && er.crew_member_id === crewMemberId
            );
            
            if (!isAssignedToThisEvent) continue;
            
            const conflictResult = await checkCrewConflicts(crewMemberId, [event.date]);
            
            // Filter out conflicts from events in THIS SAME SECTION (not actual conflicts)
            const actualConflicts = conflictResult.conflictingEvents.filter(
              conflictEvent => !eventIds.has(conflictEvent.eventId)
            );
            
            if (actualConflicts.length > 0) {
              conflictCount++;
              break; // Found a real conflict, no need to check more
            }
          }
          
          if (conflictCount > 0) break; // Exit outer loop if conflict found
        }

        return { 
          hasConflicts: conflictCount > 0, 
          conflictCount 
        };
      } catch (error) {
        console.error('Error checking crew conflicts:', error);
        return { hasConflicts: false, conflictCount: 0 };
      }
    },
    enabled: !!firstEvent?.project_id && events.length > 0 && !!eventRoles
  });

  // Simple check: Are all existing event roles assigned? (ignoring project roles completely)
  const allEventsSynced = useMemo(() => {
    if (!eventRoles?.length) return false;
    
    // Group roles by event
    const rolesByEvent = new Map();
    eventRoles.forEach(role => {
      if (!rolesByEvent.has(role.event_id)) {
        rolesByEvent.set(role.event_id, []);
      }
      rolesByEvent.get(role.event_id).push(role);
    });
    
    // Check if each event that NEEDS CREW has all its roles assigned
    for (const event of events) {
      // Skip events that don't need crew (like external storage, etc.)
      if (!event.type.needs_crew) continue;
      
      const eventRolesList = rolesByEvent.get(event.id) || [];
      
      // If this crew-needing event has no roles at all, skip it (might not be synced yet)
      if (eventRolesList.length === 0) continue;
      
      // If any role for this crew-needing event is unassigned, section is not fully synced
      const hasUnassignedRoles = eventRolesList.some(role => !role.crew_member_id);
      if (hasUnassignedRoles) {
        return false;
      }
    }
    
    return true;
  }, [events, eventRoles]);



  // Show nothing if there are no events, no crew needed, or no project roles
  if (!firstEvent || !firstEvent.type.needs_crew || !hasProjectRoles) return null;

  const hasConflicts = conflictsData?.hasConflicts || false;
  const isLoading = isChecking || isCheckingConflicts;
  
  // Debug logging for section header
  console.log('🔍 HeaderCrewIcon Section Debug:');
  console.log('📊 Section Overview:', {
    eventsCount: events.length,
    eventIds: events.map(e => e.id),
    allEventsSynced,
    hasConflicts,
    decision: hasConflicts ? 'RED (conflicts)' : allEventsSynced ? 'GREEN (all synced)' : 'BLUE (unassigned)'
  });
  
  console.log('👥 Event Roles Data:', eventRoles?.map(er => ({
    eventId: er.event_id,
    roleId: er.role_id,
    crewMemberId: er.crew_member_id,
    assigned: !!er.crew_member_id
  })));
  
  // Debug each event's assignment status
  const rolesByEvent = new Map();
  eventRoles?.forEach(role => {
    if (!rolesByEvent.has(role.event_id)) {
      rolesByEvent.set(role.event_id, []);
    }
    rolesByEvent.get(role.event_id).push(role);
  });
  
  events.forEach(event => {
    const eventRolesList = rolesByEvent.get(event.id) || [];
    const hasUnassignedRoles = eventRolesList.some(role => !role.crew_member_id);
    const needsCrew = event.type.needs_crew;
    console.log(`📅 Event ${event.id} (${event.type.name}):`, {
      needsCrew,
      included: needsCrew ? 'YES - checking assignments' : 'NO - skipping (no crew needed)',
      rolesCount: eventRolesList.length,
      assignedRoles: eventRolesList.filter(r => r.crew_member_id).length,
      unassignedRoles: eventRolesList.filter(r => !r.crew_member_id).length,
      hasUnassignedRoles,
      roles: eventRolesList.map(r => ({
        roleId: r.role_id,
        assigned: !!r.crew_member_id,
        crewId: r.crew_member_id
      }))
    });
  });
  
  console.log('⚠️ Conflicts:', conflictsData);
  
  // Priority: Red (conflicts) > Green (all assigned) > Blue (unassigned)
  if (hasConflicts) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            disabled={isLoading}
          >
            <Users className="h-6 w-6 text-red-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem 
            onClick={onSyncPreferredCrew}
            className="flex items-center gap-2"
          >
            Sync preferred crew
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => {/* TODO: Show conflict details */}}
            className="flex items-center gap-2"
          >
            View conflicts
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  // If all crew is assigned and no conflicts, show green icon without dropdown
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
          disabled={isLoading}
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
        <DropdownMenuItem 
          onClick={() => {/* TODO: View unassigned roles */}}
          className="flex items-center gap-2"
        >
          View unassigned roles
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}