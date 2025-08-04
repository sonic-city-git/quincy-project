/**
 * PROJECT CONFLICTS OPTIMIZATION
 * 
 * Provides efficient conflict detection for project components by leveraging
 * the planner's pre-calculated warnings instead of running individual queries.
 * 
 * Benefits:
 * - Reuses planner's optimized calculations
 * - Fast lookup for specific events/crews
 * - Consistent with 30-day conflict detection standard
 * - Eliminates duplicate Supabase queries
 */

import { useMemo } from 'react';
import { useConsolidatedConflicts } from './useConsolidatedConflicts';

interface ProjectConflictResult {
  hasConflicts: boolean;
  conflictCount: number;
  conflictDetails: Array<{
    resourceId: string;
    resourceName: string;
    date: string;
    type: 'equipment' | 'crew';
    severity: 'low' | 'medium' | 'high';
  }>;
}

interface UseProjectConflictsProps {
  projectId?: string;
  eventIds?: string[];
  crewMemberIds?: string[];
  equipmentIds?: string[];
  dates?: string[];
}

export function useProjectConflicts({
  projectId,
  eventIds,
  crewMemberIds,
  equipmentIds,
  dates
}: UseProjectConflictsProps = {}): ProjectConflictResult {
  
  // Get consolidated conflicts data (leverages planner calculations)
  const { 
    equipmentConflictDetails, 
    crewConflictDetails, 
    plannerWarnings,
    isLoading 
  } = useConsolidatedConflicts();

  // Fast conflict checking using pre-calculated data
  const conflictResult = useMemo(() => {
    if (isLoading || !plannerWarnings?.length) {
      return { hasConflicts: false, conflictCount: 0, conflictDetails: [] };
    }

    const relevantConflicts = plannerWarnings.filter(warning => {
      // Filter by specific criteria if provided
      if (crewMemberIds?.length && !crewMemberIds.includes(warning.resourceId)) {
        return false;
      }
      if (equipmentIds?.length && !equipmentIds.includes(warning.resourceId)) {
        return false;
      }
      if (dates?.length && !dates.includes(warning.date)) {
        return false;
      }
      
      return true;
    });

    const conflictDetails = relevantConflicts.map(warning => ({
      resourceId: warning.resourceId,
      resourceName: warning.resourceName,
      date: warning.date,
      type: warning.type === 'overbooked' ? 'equipment' as const : 'crew' as const,
      severity: warning.severity
    }));

    return {
      hasConflicts: conflictDetails.length > 0,
      conflictCount: conflictDetails.length,
      conflictDetails
    };
  }, [plannerWarnings, crewMemberIds, equipmentIds, dates, isLoading]);

  return conflictResult;
}

/**
 * CREW-SPECIFIC CONFLICT HOOK
 * 
 * Optimized for project components that only need crew conflict checking.
 * Replaces the inefficient individual checkCrewConflicts() calls.
 */
export function useCrewConflicts(crewMemberIds: string[], dates?: string[]) {
  const { crewConflictDetails, isLoading } = useConsolidatedConflicts();

  return useMemo(() => {
    if (isLoading || !crewConflictDetails?.length) {
      return { hasConflicts: false, conflictCount: 0, conflicts: [] };
    }

    // Filter for specific crew members and dates
    const relevantConflicts = crewConflictDetails.filter(conflict => {
      if (!crewMemberIds.includes(conflict.crewMemberId)) return false;
      if (dates?.length && !dates.includes(conflict.date)) return false;
      return true;
    });

    return {
      hasConflicts: relevantConflicts.length > 0,
      conflictCount: relevantConflicts.length,
      conflicts: relevantConflicts
    };
  }, [crewConflictDetails, crewMemberIds, dates, isLoading]);
}

/**
 * EVENT-SPECIFIC CONFLICT HOOK
 * 
 * Fast conflict checking for individual events using pre-calculated warnings.
 * Replaces the complex event-by-event queries in EventCardIcons.
 */
export function useEventConflicts(eventId: string, eventDate: Date) {
  const { plannerWarnings, isLoading } = useConsolidatedConflicts();

  return useMemo(() => {
    if (isLoading || !plannerWarnings?.length) {
      return { hasConflicts: false };
    }

    const eventDateStr = eventDate.toISOString().split('T')[0];
    
    // Check if any resources have conflicts on this event's date
    // Note: This gives a general conflict indication, not specific to this event's resources
    const hasConflictsOnDate = plannerWarnings.some(warning => 
      warning.date === eventDateStr
    );

    return { hasConflicts: hasConflictsOnDate };
  }, [plannerWarnings, eventId, eventDate, isLoading]);
}

/**
 * SECTION-SPECIFIC CONFLICT HOOK
 * 
 * Optimized for event section headers that need to check conflicts across multiple events.
 * Replaces the complex loop-based conflict checking in HeaderCrewIcon.
 */
export function useSectionConflicts(events: Array<{ id: string; date: Date }>, crewMemberIds: string[]) {
  const dates = useMemo(() => 
    events.map(e => e.date.toISOString().split('T')[0]), 
    [events]
  );

  return useCrewConflicts(crewMemberIds, dates);
}