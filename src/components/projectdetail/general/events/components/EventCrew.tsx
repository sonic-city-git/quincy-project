/**
 * 🎯 EVENT CREW COMPONENT
 * 
 * Handles crew assignment status and actions for events
 * Consolidated from: HeaderCrewIcon, crew logic in EventCardIcons
 */

import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { CrewRolesDialog } from '../dialogs/CrewRolesDialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CalendarEvent } from '@/types/events';
import { useEventSyncStatus } from '@/hooks/useConsolidatedSyncStatus';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

export interface EventCrewProps {
  event?: CalendarEvent;
  events?: CalendarEvent[];
  variant?: 'icon' | 'section';
  disabled?: boolean;
  className?: string;
  isSynced?: boolean;
  hasProjectRoles?: boolean;
  onSyncPreferredCrew?: () => void;
  onViewConflicts?: () => void;
  onManualAssign?: () => void;
}



export function EventCrew({
  event,
  events = [],
  variant = 'icon',
  disabled = false,
  className,
  isSynced,
  hasProjectRoles,
  onSyncPreferredCrew,
  onViewConflicts,
  onManualAssign
}: EventCrewProps) {
  const targetEvent = event || events[0];
  const targetEvents = events.length > 0 ? events : (targetEvent ? [targetEvent] : []);
  const [showRolesDialog, setShowRolesDialog] = useState(false);
  
  // Use props if provided, otherwise get from hook
  const syncStatus = useEventSyncStatus(targetEvent);
  const actualHasProjectRoles = hasProjectRoles ?? syncStatus.hasProjectRoles;
  const actualIsCrewSynced = isSynced ?? syncStatus.isCrewSynced;
  
  // Get crew assignments for the event(s)
  const { data: eventRoles } = useQuery({
    queryKey: ['event-roles', targetEvents.map(e => e.id)],
    queryFn: async () => {
      const { data } = await supabase
        .from('project_event_roles')
        .select('event_id, crew_member_id, role_id')
        .in('event_id', targetEvents.map(e => e.id));
      return data || [];
    },
    enabled: targetEvents.length > 0
  });

  // Calculate sync status like HeaderCrewIcon
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
    
    // Check if each crew-needing event has all its roles assigned
    for (const evt of targetEvents) {
      if (!evt.type.needs_crew) continue;
      
      const eventRolesList = rolesByEvent.get(evt.id) || [];
      if (eventRolesList.length === 0) continue;
      
      const hasUnassignedRoles = eventRolesList.some(role => !role.crew_member_id);
      if (hasUnassignedRoles) {
        return false;
      }
    }
    
    return true;
  }, [targetEvents, eventRoles]);

  // Don't render if no crew needed or no project roles
  if (!targetEvent?.type?.needs_crew || !actualHasProjectRoles) {
    return null;
  }

  const hasConflicts = false; // TODO: Implement conflict detection like HeaderCrewIcon
  const isMultiple = targetEvents.length > 1;

  // Priority: Red (conflicts) > Green (all assigned) > Blue (unassigned)
  if (hasConflicts) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            disabled={disabled}
          >
            <Users className="h-5 w-5 text-red-500" />
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
            onClick={onViewConflicts}
            className="flex items-center gap-2"
          >
            View conflicts
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  // If all crew is assigned and no conflicts, show green icon without dropdown
  if (actualIsCrewSynced || allEventsSynced) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="h-10 w-10 flex items-center justify-center">
            <Users className="h-5 w-5 text-green-500" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Crew is assigned</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Show blue icon with dropdown for unassigned crew
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            disabled={disabled}
          >
            <Users className={cn("h-5 w-5", "text-blue-500")} />
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
            onClick={() => setShowRolesDialog(true)}
            className="flex items-center gap-2"
          >
            View crew roles
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Crew Roles Dialog */}
      {targetEvent && (
        <CrewRolesDialog
          isOpen={showRolesDialog}
          onOpenChange={setShowRolesDialog}
          event={targetEvent}
          onSyncPreferredCrew={onSyncPreferredCrew}
        />
      )}
    </>
  );
}

/**
 * Crew status utilities
 */
export const crewUtils = {
  getStatus: (assignedCount: number, totalCount: number, hasConflicts: boolean) => {
    if (hasConflicts) return 'conflicts';
    if (assignedCount === totalCount && totalCount > 0) return 'synced';
    if (assignedCount > 0) return 'partial';
    return 'not-synced';
  },
  
  getStatusConfig: (status: keyof typeof CREW_STATUS) => 
    CREW_STATUS[status],
  
  getAssignmentSummary: (assignedCount: number, totalCount: number, hasConflicts: boolean) => 
    `${assignedCount}/${totalCount} assigned${hasConflicts ? ' • conflicts detected' : ''}`
} as const;