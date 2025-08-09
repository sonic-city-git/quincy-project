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

// ============================================================================
// INTERFACES - Following Established Patterns
// ============================================================================

interface EventOperationalStatus {
  // Core Data (consistent with other hooks)
  equipment: {
    status: 'available' | 'overbooked' | 'subrental';
    conflicts: Array<{
      equipmentId: string;
      equipmentName: string;
      overbooked: number;
      conflictingEvents: Array<{
        eventName: string;
        projectName: string;
        quantity: number;
      }>;
    }>;
  };
  
  crew: {
    status: 'complete' | 'conflicts' | 'unfilled' | 'non-preferred';
    overbookings: Array<{
      crewMemberId: string;
      crewMemberName: string;
      date: string;
      conflictingAssignments: Array<{
        eventName: string;
        projectName: string;
        role?: string;
      }>;
    }>;
    unfilledCount: number;
    nonPreferredCount: number;
    roles: any[];
    nonPreferredRoles: any[];
  };
  
  // Meta (consistent with established patterns)
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
    queryKey: ['event-roles', event.id], // Consistent with established patterns
    queryFn: async () => {
      if (!event.id) return null;
      
      try {
        const { data, error: queryError } = await supabase
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
        
        if (queryError) {
          throw new Error(`Failed to fetch event roles: ${queryError.message}`);
        }
        
        return data || [];
      } catch (error) {
        console.error('Event roles query failed:', error);
        throw error;
      }
    },
    enabled: !!event.id && !!event.type?.needs_crew,
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    retry: 1,
    refetchOnWindowFocus: false
  });
  
  // Memoize event date formatting (performance optimization)
  const eventDateString = useMemo(() => {
    if (!event.date) return '';
    return event.date instanceof Date 
      ? event.date.toISOString().split('T')[0]
      : new Date(event.date).toISOString().split('T')[0];
  }, [event.date]);

  // Process equipment conflicts specific to this event
  const equipmentStatus = useMemo(() => {
    if (!eventDateString || !allEquipmentConflicts?.length) {
      return {
        status: 'available' as const,
        conflicts: []
      };
    }
    
    // Find conflicts on this event's date that involve this event
    const relevantConflicts = allEquipmentConflicts.filter(conflict => {
      if (conflict.date !== eventDateString) return false;
      
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
  }, [eventDateString, event.name, event.project?.name, allEquipmentConflicts]);
  
  // Process crew conflicts and role analysis (optimized single pass)
  const crewAnalysis = useMemo(() => {
    if (!eventRoles || !event.type?.needs_crew) {
      return {
        status: 'complete' as const,
        overbookings: [],
        unfilledRoles: [],
        nonPreferredRoles: [],
        unfilledCount: 0,
        nonPreferredCount: 0
      };
    }
    
    // Find crew overbookings that affect this event's date
    const eventCrewOverbookings = crewConflictDetails?.filter(conflict => 
      conflict.date === eventDateString
    ).map(conflict => ({
      ...conflict,
      date: conflict.date // Ensure date field is explicitly included
    })) || [];
    
    // Single pass analysis of role assignments (performance optimization)
    const unfilledRoles: any[] = [];
    const nonPreferredRoles: any[] = [];
    
    eventRoles.forEach(role => {
      if (!role.crew_member_id) {
        unfilledRoles.push(role);
      } else if (role.project_roles?.preferred_id && 
                 role.crew_member_id !== role.project_roles.preferred_id) {
        nonPreferredRoles.push(role);
      }
    });
    
    // Determine primary status
    let status: 'complete' | 'conflicts' | 'unfilled' | 'non-preferred' = 'complete';
    
    if (eventCrewOverbookings.length > 0) {
      status = 'conflicts';
    } else if (unfilledRoles.length > 0) {
      status = 'unfilled';
    } else if (nonPreferredRoles.length > 0) {
      status = 'non-preferred';
    }
    
    return {
      status,
      overbookings: eventCrewOverbookings,
      unfilledRoles,
      nonPreferredRoles,
      unfilledCount: unfilledRoles.length,
      nonPreferredCount: nonPreferredRoles.length
    };
  }, [eventRoles, eventDateString, event.type?.needs_crew, crewConflictDetails]);
  
  // Determine loading state
  const isLoading = equipmentLoading || crewConflictsLoading || rolesLoading;
  
  return {
    // Equipment (structured data object)
    equipment: {
      status: equipmentStatus.status,
      conflicts: equipmentStatus.conflicts
    },
    
    // Crew (structured data object)
    crew: {
      status: crewAnalysis.status,
      overbookings: crewAnalysis.overbookings,
      unfilledCount: crewAnalysis.unfilledCount,
      nonPreferredCount: crewAnalysis.nonPreferredCount,
      roles: eventRoles || [],
      nonPreferredRoles: crewAnalysis.nonPreferredRoles
    },
    
    // Meta (consistent with established patterns)
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
  const { equipment, isLoading, error } = useEventOperationalStatus(event);
  
  return {
    hasOverbookings: equipment.status === 'overbooked',
    hasSubrentals: equipment.status === 'subrental',
    isAvailable: equipment.status === 'available',
    conflicts: equipment.conflicts,
    isLoading,
    error
  };
}

/**
 * 🎯 SIMPLIFIED CREW STATUS HOOK
 * 
 * Optimized for event cards that only need crew status.
 */
export function useEventCrewStatus(event: CalendarEvent) {
  const { crew, isLoading, error } = useEventOperationalStatus(event);
  
  return {
    hasCrewOverbookings: crew.status === 'conflicts',
    hasUnfilledRoles: crew.status === 'unfilled' || crew.unfilledCount > 0,
    hasNonPreferredCrew: crew.status === 'non-preferred',
    allRolesFilled: crew.status !== 'unfilled' && crew.unfilledCount === 0,
    conflicts: crew.overbookings,
    unfilledCount: crew.unfilledCount,
    nonPreferredCount: crew.nonPreferredCount,
    eventRoles: crew.roles,
    nonPreferredRoles: crew.nonPreferredRoles,
    isLoading,
    error
  };
}
