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
import { useEventCrewStatus } from '@/hooks/event/useEventOperationalStatus';
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

  // Get real crew operational status for this specific event
  const { 
    hasCrewOverbookings, 
    hasUnfilledRoles, 
    hasNonPreferredCrew, 
    allRolesFilled,
    conflicts: eventCrewConflicts,
    unfilledCount,
    nonPreferredCount,
    eventRoles,
    nonPreferredRoles,
    isLoading
  } = useEventCrewStatus(targetEvent!);
  
  // Operational status logic based on requirements:
  // 🟢 Green: All roles filled with preferred crew
  // 🔴 Red: Crew member assigned to multiple events (overbooking) OR unfilled roles
  // 🔵 Blue: Event resolved with non-preferred crew
  // Status is now provided directly by the specialized hook

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
      {targetEvent && (
        <CrewAssignmentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          event={targetEvent}
          conflicts={eventCrewConflicts}
          eventRoles={eventRoles}
          unfilledCount={unfilledCount}
          nonPreferredCount={nonPreferredCount}
          nonPreferredRoles={nonPreferredRoles}
        />
      )}
    </>
  );
}