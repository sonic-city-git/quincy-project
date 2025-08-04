/**
 * CONSOLIDATED CONFLICTS HOOK
 * 
 * Provides equipment and crew conflict data using the planner's existing calculations
 * instead of running duplicate queries. This eliminates the performance bottleneck
 * where dashboard components were re-calculating data that planner already has.
 * 
 * Key Benefits:
 * - Single source of truth for conflict detection
 * - Leverages planner's optimized calculations  
 * - Consistent 30-day timeframe across app
 * - Eliminates duplicate Supabase queries
 */

import { useMemo } from 'react';
import { useTimelineHub } from '@/components/planner/shared/hooks/useTimelineHub';
import { getWarningTimeframe } from '@/constants/timeframes';

interface ConsolidatedConflictsResult {
  // Dashboard-compatible format
  equipmentConflicts: number;
  crewConflicts: number;
  
  // Detailed conflict data
  equipmentConflictDetails: Array<{
    equipmentId: string;
    equipmentName: string;
    date: string;
    totalStock: number;
    totalUsed: number;
    overbooked: number;
    conflictingEvents: Array<{
      eventName: string;
      projectName: string;
      quantity: number;
    }>;
  }>;
  
  crewConflictDetails: Array<{
    crewMemberId: string;
    crewMemberName: string;
    date: string;
    conflictingAssignments: Array<{
      eventName: string;
      projectName: string;
      role?: string;
    }>;
  }>;
  
  // Raw planner data (for advanced use cases)
  plannerWarnings: any[];
  isLoading: boolean;
}

interface UseConsolidatedConflictsProps {
  selectedOwner?: string;
  /** Override timeframe (defaults to 30-day standard) */
  periodStart?: Date;
  periodEnd?: Date;
}

export function useConsolidatedConflicts({
  selectedOwner,
  periodStart,
  periodEnd
}: UseConsolidatedConflictsProps = {}): ConsolidatedConflictsResult {
  
  // Use standard 30-day timeframe if not overridden
  const { startDate, endDate } = useMemo(() => {
    if (periodStart && periodEnd) {
      return { 
        startDate: periodStart.toISOString().split('T')[0],
        endDate: periodEnd.toISOString().split('T')[0]
      };
    }
    return getWarningTimeframe();
  }, [periodStart, periodEnd]);

  // Get equipment data from planner (reuse existing calculations)
  const equipmentData = useTimelineHub({
    resourceType: 'equipment',
    periodStart: new Date(startDate),
    periodEnd: new Date(endDate),
    selectedOwner,
    enabled: true
  });

  // Get crew data from planner (reuse existing calculations)  
  const crewData = useTimelineHub({
    resourceType: 'crew',
    periodStart: new Date(startDate),
    periodEnd: new Date(endDate),
    selectedOwner,
    enabled: true
  });

  // Process equipment conflicts (transform planner data to dashboard format)
  const equipmentConflictDetails = useMemo(() => {
    if (!equipmentData.warnings) return [];
    
    return equipmentData.warnings
      .filter(warning => warning.type === 'overbooked')
      .map(warning => ({
        equipmentId: warning.resourceId,
        equipmentName: warning.resourceName,
        date: warning.date,
        totalStock: warning.details?.stock || 0,
        totalUsed: warning.details?.used || 0,
        overbooked: warning.details?.overbooked || 0,
        conflictingEvents: warning.details?.events?.map((event: any) => ({
          eventName: event.eventName,
          projectName: event.projectName,
          quantity: event.quantity
        })) || []
      }));
  }, [equipmentData.warnings]);

  // Process crew conflicts
  const crewConflictDetails = useMemo(() => {
    if (!crewData.warnings) return [];
    
    return crewData.warnings
      .filter(warning => warning.type === 'conflict')
      .map(warning => ({
        crewMemberId: warning.resourceId,
        crewMemberName: warning.resourceName,
        date: warning.date,
        conflictingAssignments: warning.details?.assignments?.map((assignment: any) => ({
          eventName: assignment.eventName,
          projectName: assignment.projectName,
          role: assignment.role
        })) || []
      }));
  }, [crewData.warnings]);

  // Dashboard-compatible counts
  const equipmentConflicts = equipmentConflictDetails.length;
  const crewConflicts = crewConflictDetails.length;

  // Combined loading state
  const isLoading = equipmentData.isLoading || crewData.isLoading;

  return {
    equipmentConflicts,
    crewConflicts,
    equipmentConflictDetails,
    crewConflictDetails,
    plannerWarnings: [...(equipmentData.warnings || []), ...(crewData.warnings || [])],
    isLoading
  };
}

/**
 * EQUIPMENT-ONLY CONFLICTS HOOK
 * 
 * Optimized version for dashboard components that only need equipment conflicts.
 * Uses the same underlying planner calculations but skips crew data fetching.
 */
export function useEquipmentConflicts(selectedOwner?: string) {
  const { startDate, endDate } = getWarningTimeframe();
  
  const equipmentData = useTimelineHub({
    resourceType: 'equipment',
    periodStart: new Date(startDate),
    periodEnd: new Date(endDate),
    selectedOwner,
    enabled: true
  });

  return useMemo(() => {
    const conflicts = equipmentData.warnings?.filter(w => w.type === 'overbooked') || [];
    
    return {
      conflicts: conflicts.map(warning => ({
        equipmentId: warning.resourceId,
        equipmentName: warning.resourceName,
        date: warning.date,
        totalStock: warning.details?.stock || 0,
        totalUsed: warning.details?.used || 0,
        overbooked: warning.details?.overbooked || 0,
        conflictingEvents: warning.details?.events?.map((event: any) => ({
          eventName: event.eventName,
          projectName: event.projectName,
          quantity: event.quantity
        })) || []
      })),
      conflictCount: conflicts.length,
      isLoading: equipmentData.isLoading
    };
  }, [equipmentData.warnings, equipmentData.isLoading]);
}