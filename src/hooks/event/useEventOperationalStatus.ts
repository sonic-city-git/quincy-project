/**
 * 🎯 EVENT OPERATIONAL STATUS HOOK
 * 
 * Provides real-time operational intelligence for individual events.
 * Replaces placeholder logic with comprehensive status detection:
 * - Equipment overbookings specific to this event
 * - Crew conflicts involving this event's assignments
 * - Non-preferred crew assignments
 * - Unfilled role positions
 * 
 * Key Benefits:
 * - Event-specific filtering (no false positives)
 * - Real business intelligence (not technical sync status)
 * - Optimized queries for individual event cards
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEquipmentConflicts, useConsolidatedConflicts } from '@/hooks/global/useConsolidatedConflicts';
import { CalendarEvent } from '@/types/events';

interface EventOperationalStatus {
  // Equipment Status
  equipmentStatus: 'available' | 'overbooked' | 'subrental';
  equipmentConflicts: Array<{
    equipmentId: string;
    equipmentName: string;
    overbooked: number;
    conflictingEvents: Array<{
      eventName: string;
      projectName: string;
      quantity: number;
    }>;
  }>;
  
  // Crew Status  
  crewStatus: 'complete' | 'conflicts' | 'unfilled' | 'non-preferred';
  crewOverbookings: Array<{
    crewMemberId: string;
    crewMemberName: string;
    conflictingAssignments: Array<{
      eventName: string;
      projectName: string;
      role?: string;
    }>;
  }>;
  unfilledRoles: number;
  nonPreferredAssignments: number;
  
  // Detailed Role Data (for dialogs)
  eventRoles: any[];
  nonPreferredRoles: any[];
  
  // Loading States
  isLoading: boolean;
  error: Error | null;
}

export function useEventOperationalStatus(event: CalendarEvent): EventOperationalStatus {
  
  // Get equipment conflicts using existing efficient hook
  const { conflicts: allEquipmentConflicts, isLoading: equipmentLoading } = useEquipmentConflicts();
  
  // Get crew conflicts using existing efficient hook
  const { crewConflictDetails, isLoading: crewConflictsLoading } = useConsolidatedConflicts();
  
  // Get detailed event role assignments for crew analysis
  const { data: eventRoles, isLoading: rolesLoading, error } = useQuery({
    queryKey: ['event-operational-status', event.id],
    queryFn: async () => {
      if (!event.id) return null;
      
      const { data } = await supabase
        .from('project_event_roles')
        .select(`
          *,
          crew_members(id, name),
          crew_roles(id, name),
          project_roles!project_event_roles_role_id_fkey(
            id,
            preferred_id
          )
        `)
        .eq('event_id', event.id);
      
      return data || [];
    },
    enabled: !!event.id && !!event.type?.needs_crew
  });
  
  // Process equipment conflicts specific to this event
  const equipmentStatus = useMemo(() => {
    if (!event.date || !allEquipmentConflicts?.length) {
      return {
        status: 'available' as const,
        conflicts: []
      };
    }
    
    // Format event date for comparison
    const eventDate = event.date instanceof Date 
      ? event.date.toISOString().split('T')[0]
      : new Date(event.date).toISOString().split('T')[0];
    
    // Find conflicts on this event's date that involve this event
    const relevantConflicts = allEquipmentConflicts.filter(conflict => {
      if (conflict.date !== eventDate) return false;
      
      // Check if this event is actually involved in the conflict
      return conflict.conflictingEvents?.some(conflictEvent => 
        conflictEvent.eventName === event.name ||
        conflictEvent.projectName === event.project?.name
      );
    });
    
    return {
      status: relevantConflicts.length > 0 ? 'overbooked' as const : 'available' as const,
      conflicts: relevantConflicts
    };
  }, [event.date, event.name, event.project?.name, allEquipmentConflicts]);
  
  // Process crew conflicts specific to this event
  const crewStatus = useMemo(() => {
    if (!eventRoles || !event.type?.needs_crew) {
      return {
        status: 'complete' as const,
        overbookings: [],
        unfilledCount: 0,
        nonPreferredCount: 0
      };
    }
    
    // Format event date for crew conflict comparison
    const eventDate = event.date instanceof Date 
      ? event.date.toISOString().split('T')[0]
      : new Date(event.date).toISOString().split('T')[0];
    
    // Find crew overbookings that affect this event's date
    const eventCrewOverbookings = crewConflictDetails?.filter(conflict => 
      conflict.date === eventDate
    ) || [];
    
    // Analyze role assignments
    const unfilledRoles = eventRoles.filter(role => !role.crew_member_id);
    
    const nonPreferredAssignments = eventRoles.filter(role => {
      if (!role.crew_member_id || !role.project_roles?.preferred_id) {
        return false;
      }
      return role.crew_member_id !== role.project_roles.preferred_id;
    });
    
    // Determine primary status
    let status: 'complete' | 'conflicts' | 'unfilled' | 'non-preferred' = 'complete';
    
    if (eventCrewOverbookings.length > 0) {
      status = 'conflicts';
    } else if (unfilledRoles.length > 0) {
      status = 'unfilled';
    } else if (nonPreferredAssignments.length > 0) {
      status = 'non-preferred';
    }
    
    return {
      status,
      overbookings: eventCrewOverbookings,
      unfilledCount: unfilledRoles.length,
      nonPreferredCount: nonPreferredAssignments.length
    };
  }, [eventRoles, event.date, event.type?.needs_crew, crewConflictDetails]);
  
  // Determine loading state
  const isLoading = equipmentLoading || crewConflictsLoading || rolesLoading;
  
  return {
    // Equipment
    equipmentStatus: equipmentStatus.status,
    equipmentConflicts: equipmentStatus.conflicts,
    
    // Crew
    crewStatus: crewStatus.status,
    crewOverbookings: crewStatus.overbookings,
    unfilledRoles: crewStatus.unfilledCount,
    nonPreferredAssignments: crewStatus.nonPreferredCount,
    
    // Detailed Role Data
    eventRoles: eventRoles || [],
    nonPreferredRoles: eventRoles?.filter(role => {
      if (!role.crew_member_id || !role.project_roles?.preferred_id) {
        return false;
      }
      return role.crew_member_id !== role.project_roles.preferred_id;
    }) || [],
    
    // Meta
    isLoading,
    error: error as Error | null
  };
}

/**
 * 🎯 SIMPLIFIED EQUIPMENT STATUS HOOK
 * 
 * Optimized for event cards that only need equipment status.
 */
export function useEventEquipmentStatus(event: CalendarEvent) {
  const { equipmentStatus, equipmentConflicts, isLoading } = useEventOperationalStatus(event);
  
  return {
    hasOverbookings: equipmentStatus === 'overbooked',
    hasSubrentals: equipmentStatus === 'subrental',
    isAvailable: equipmentStatus === 'available',
    conflicts: equipmentConflicts,
    isLoading
  };
}

/**
 * 🎯 SIMPLIFIED CREW STATUS HOOK
 * 
 * Optimized for event cards that only need crew status.
 */
export function useEventCrewStatus(event: CalendarEvent) {
  const { 
    crewStatus, 
    crewOverbookings, 
    unfilledRoles, 
    nonPreferredAssignments, 
    eventRoles,
    nonPreferredRoles,
    isLoading 
  } = useEventOperationalStatus(event);
  
  return {
    hasCrewOverbookings: crewStatus === 'conflicts',
    hasUnfilledRoles: crewStatus === 'unfilled' || unfilledRoles > 0,
    hasNonPreferredCrew: crewStatus === 'non-preferred',
    allRolesFilled: crewStatus !== 'unfilled' && unfilledRoles === 0,
    conflicts: crewOverbookings,
    unfilledCount: unfilledRoles,
    nonPreferredCount: nonPreferredAssignments,
    eventRoles,
    nonPreferredRoles,
    isLoading
  };
}
