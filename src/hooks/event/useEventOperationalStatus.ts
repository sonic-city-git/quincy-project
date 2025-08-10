/**
 * 🎯 EVENT OPERATIONAL STATUS - ONE ENGINE VERSION
 * 
 * ✅ MIGRATED TO ONE ENGINE ARCHITECTURE
 * ❌ DELETED: useEquipmentConflicts, useConsolidatedConflicts (fragmented logic)
 * ✅ USES: useProjectConflicts (optimized project wrapper)
 * 
 * Provides real-time operational intelligence for individual events using
 * the unified stock engine with virtual stock calculations.
 * 
 * Benefits:
 * - Virtual stock awareness (subrentals resolve conflicts)
 * - Single source of truth for all conflict data
 * - Event-specific filtering with global consistency
 * - Real business intelligence (not technical sync status)
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProjectConflicts } from '@/hooks/useProjectConflicts';
import { CalendarEvent } from '@/types/events';

// ============================================================================
// INTERFACES
// ============================================================================

interface EventOperationalStatus {
  // Equipment - Virtual Stock Aware
  equipment: {
    status: 'available' | 'overbooked' | 'resolved'; // resolved = virtual stock fixed conflicts
    conflicts: Array<{
      equipmentId: string;
      equipmentName: string;
      deficit: number;
      effectiveStock: number; // includes virtual stock
      totalUsed: number;
      virtualAdditions: number; // from subrentals
      conflictingEvents: Array<{
        eventName: string;
        projectName: string;
        quantity: number;
      }>;
    }>;
  };
  
  // Crew - Phase 6: Will be integrated into stock engine
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
  
  isLoading: boolean;
  error: Error | null;
}

export function useEventOperationalStatus(event: CalendarEvent): EventOperationalStatus {
  
  // Get event equipment IDs for targeted conflict analysis
  const { data: eventEquipment } = useQuery({
    queryKey: ['event-equipment', event.id],
    queryFn: async () => {
      if (!event.id) return [];
      
      const { data, error } = await supabase
        .from('project_event_equipment')
        .select('equipment_id')
        .eq('event_id', event.id);
      
      if (error) throw error;
      return data?.map(item => item.equipment_id) || [];
    },
    enabled: !!event.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ONE ENGINE - Get conflicts for this event's equipment and dates
  const eventDateString = useMemo(() => {
    if (!event.date) return '';
    return event.date instanceof Date 
      ? event.date.toISOString().split('T')[0]
      : new Date(event.date).toISOString().split('T')[0];
  }, [event.date]);

  // Get project ID for this event  
  const projectId = event.project_id || '';
  
  const {
    conflicts,
    isLoading: stockLoading
  } = useProjectConflicts(projectId);
  
  // Get detailed event role assignments for crew analysis
  const { data: eventRoles, isLoading: rolesLoading, error } = useQuery({
    queryKey: ['event-roles', event.id],
    queryFn: async () => {
      if (!event.id) return null;
      
      const { data, error: queryError } = await supabase
        .from('project_event_roles')
        .select(`
          *,
          crew_members(id, name),
          crew_roles(id, name),
          project_roles!project_event_roles_project_role_id_fkey(
            id,
            preferred_id
          )
        `)
        .eq('event_id', event.id);
      
      if (queryError) throw queryError;
      return data || [];
    },
    enabled: !!event.id && !!event.type?.needs_crew,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Equipment status using ONE ENGINE data
  const equipmentStatus = useMemo(() => {
    if (!eventDateString || !conflicts?.length) {
      return {
        status: 'available' as const,
        conflicts: []
      };
    }
    
    // Filter conflicts to only those affecting this event's date
    // Since we're using useProjectConflicts(projectId), conflicts are already project-scoped
    const relevantConflicts = conflicts.filter(conflict => 
      conflict.date === eventDateString
    );
    
    // Check if conflicts are resolved by virtual stock
    const hasUnresolvedConflicts = relevantConflicts.some(conflict => 
      conflict.conflict.deficit > 0
    );
    
    const hasResolvedConflicts = relevantConflicts.some(conflict => 
      conflict.stockBreakdown.virtualAdditions > 0 && conflict.conflict.deficit === 0
    );
    
    let status: 'available' | 'overbooked' | 'resolved' = 'available';
    if (hasUnresolvedConflicts) {
      status = 'overbooked';
    } else if (hasResolvedConflicts) {
      status = 'resolved';
    }
    
    return {
      status,
      conflicts: relevantConflicts.map(conflict => ({
        equipmentId: conflict.equipmentId,
        equipmentName: conflict.equipmentName,
        deficit: conflict.conflict.deficit,
        effectiveStock: conflict.stockBreakdown.effectiveStock,
        totalUsed: conflict.stockBreakdown.totalUsed,
        virtualAdditions: conflict.stockBreakdown.virtualAdditions,
        conflictingEvents: conflict.conflict.affectedEvents.map(affectedEvent => ({
          eventName: affectedEvent.eventName,
          projectName: affectedEvent.projectName,
          quantity: affectedEvent.quantity
        }))
      }))
    };
  }, [eventDateString, event.name, conflicts]);
  
  // Crew analysis (placeholder - will be integrated into stock engine later)
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
    
    // Phase 6: Replace with stock engine crew conflicts
    const unfilledRoles: any[] = [];
    const nonPreferredRoles: any[] = [];
    
    eventRoles.forEach(role => {
      if (!role.crew_member_id) {
        unfilledRoles.push(role);
      // Project roles relationship needs database schema fix
      } else if (false) {
        nonPreferredRoles.push(role);
      }
    });
    
    let status: 'complete' | 'conflicts' | 'unfilled' | 'non-preferred' = 'complete';
    if (unfilledRoles.length > 0) {
      status = 'unfilled';
    } else if (nonPreferredRoles.length > 0) {
      status = 'non-preferred';
    }
    
    return {
      status,
      overbookings: [], // Phase 6: Integrate crew conflicts from stock engine
      unfilledRoles,
      nonPreferredRoles,
      unfilledCount: unfilledRoles.length,
      nonPreferredCount: nonPreferredRoles.length
    };
  }, [eventRoles, event.type?.needs_crew]);
  
  const isLoading = stockLoading || rolesLoading;
  
  return {
    equipment: {
      status: equipmentStatus.status,
      conflicts: equipmentStatus.conflicts
    },
    crew: {
      status: crewAnalysis.status,
      overbookings: crewAnalysis.overbookings,
      unfilledCount: crewAnalysis.unfilledCount,
      nonPreferredCount: crewAnalysis.nonPreferredCount,
      roles: eventRoles || [],
      nonPreferredRoles: crewAnalysis.nonPreferredRoles
    },
    isLoading,
    error: error as Error | null
  };
}

/**
 * 🎯 SIMPLIFIED EQUIPMENT STATUS HOOK
 */
export function useEventEquipmentStatus(event: CalendarEvent) {
  const { equipment, isLoading, error } = useEventOperationalStatus(event);
  
  return {
    hasOverbookings: equipment.status === 'overbooked',
    hasSubrentals: equipment.status === 'resolved', // ✅ FIXED: Renamed for component compatibility
    isAvailable: equipment.status === 'available',
    conflicts: equipment.conflicts,
    isLoading,
    error
  };
}

/**
 * 🎯 SIMPLIFIED CREW STATUS HOOK
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