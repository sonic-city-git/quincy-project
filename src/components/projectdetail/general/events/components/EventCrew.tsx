/**
 * 🎯 EVENT CREW COMPONENT
 * 
 * Shows operational crew status: conflicts, warnings, assignments
 * Replaces sync functionality with operational intelligence
 */

import React, { useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CalendarEvent } from '@/types/events';
import { useConsolidatedConflicts } from '@/hooks/global/useConsolidatedConflicts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CrewAssignmentDialog } from '../dialogs/CrewAssignmentDialog';

export interface EventCrewProps {
  event?: CalendarEvent;
  events?: CalendarEvent[];
  variant?: 'icon' | 'section';
  disabled?: boolean;
  className?: string;
  onViewConflicts?: () => void;
  onManualAssign?: () => void;
}



export function EventCrew({
  event,
  events = [],
  variant = 'icon',
  disabled = false,
  className,
  onViewConflicts,
  onManualAssign
}: EventCrewProps) {
  const targetEvent = event || events[0];
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Don't render if no crew needed or no valid event
  if (!targetEvent?.type?.needs_crew || !targetEvent.id) {
    return null;
  }

  // Get real crew conflicts and event role data
  const { crewConflictDetails, isLoading: conflictsLoading } = useConsolidatedConflicts();
  
  // Get event roles to check for unfilled positions
  const { data: eventRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ['event-roles', targetEvent?.id],
    queryFn: async () => {
      if (!targetEvent?.id) return [];
      
      const { data } = await supabase
        .from('project_event_roles')
        .select(`
          *,
          crew_members(id, name),
          crew_roles(id, name)
        `)
        .eq('event_id', targetEvent.id);
      
      return data || [];
    },
    enabled: !!targetEvent?.id
  });
  
  // Check if this specific event has crew conflicts
  const eventCrewConflicts = useMemo(() => {
    if (!targetEvent?.date || !crewConflictDetails?.length) return [];
    
    // Format the event date to match conflict date format (YYYY-MM-DD)
    // Handle both Date objects and string dates
    const eventDate = targetEvent.date instanceof Date 
      ? targetEvent.date.toISOString().split('T')[0]
      : new Date(targetEvent.date).toISOString().split('T')[0];
    
    // Find crew conflicts on this event's date
    return crewConflictDetails.filter(conflict => conflict.date === eventDate);
  }, [targetEvent?.date, crewConflictDetails]);
  
  // Check for unfilled roles and non-preferred crew assignments
  const crewStatus = useMemo(() => {
    if (!eventRoles) return { allRolesFilled: true, hasNonPreferredCrew: false };
    
    const unfilledRoles = eventRoles.filter(role => !role.crew_member_id);
    
    // TODO: Implement non-preferred crew detection
    // This requires getting preferred crew from project_roles table
    // For now, we'll focus on filled vs unfilled roles
    const nonPreferredAssignments: any[] = []; // Placeholder for future implementation
    
    return {
      allRolesFilled: unfilledRoles.length === 0,
      hasNonPreferredCrew: nonPreferredAssignments.length > 0,
      unfilledCount: unfilledRoles.length,
      nonPreferredCount: nonPreferredAssignments.length
    };
  }, [eventRoles]);
  
  // Operational status logic based on requirements:
  // 🟢 Green: All roles filled with preferred crew
  // 🔴 Red: Crew member assigned to multiple events (overbooking) OR unfilled roles
  // 🔵 Blue: Event resolved with non-preferred crew
  
  const hasCrewOverbookings = eventCrewConflicts.length > 0;
  const hasNonPreferredCrew = crewStatus.hasNonPreferredCrew;
  const allRolesFilled = crewStatus.allRolesFilled;

  // Determine operational status and styling based on requirements
  const getCrewStatus = () => {
    if (hasCrewOverbookings) {
      return {
        color: 'text-red-600',
        tooltip: 'Crew member assigned to multiple events - click to resolve',
        clickable: true
      };
    }
    if (!allRolesFilled) {
      return {
        color: 'text-red-600',
        tooltip: 'Some roles unfilled - click to assign crew',
        clickable: true
      };
    }
    if (hasNonPreferredCrew) {
      return {
        color: 'text-blue-500',
        tooltip: 'Event resolved with non-preferred crew - click to view',
        clickable: true
      };
    }
    // Green - all roles filled with preferred crew
    return {
      color: 'text-green-600',
      tooltip: 'All roles filled - click to view assignments',
      clickable: true
    };
  };

  const status = getCrewStatus();

  // Handle click to open crew assignment dialog
  const handleClick = () => {
    if (status.clickable) {
      setDialogOpen(true);
    }
  };

  // Operational status icon with click handling for crew management
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`h-10 w-10 flex items-center justify-center ${
              status.clickable ? 'cursor-pointer hover:bg-muted/50 rounded' : ''
            }`}
            onClick={handleClick}
          >
            <Users className={`h-5 w-5 ${status.color}`} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{status.tooltip}</p>
        </TooltipContent>
      </Tooltip>

      {/* Crew Assignment Dialog */}
      {targetEvent && eventRoles && (
        <CrewAssignmentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          event={targetEvent}
          conflicts={eventCrewConflicts}
          eventRoles={eventRoles}
          unfilledCount={crewStatus.unfilledCount}
          nonPreferredCount={crewStatus.nonPreferredCount}
        />
      )}
    </>
  );
}