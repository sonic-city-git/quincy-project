/**
 * PROJECT CONFLICTS - UNIFIED STOCK ENGINE VERSION
 * 
 * ✅ COMPLETELY REDESIGNED FOR UNIFIED STOCK ENGINE
 * 
 * Provides efficient conflict detection for project components using the new 
 * unified stock engine with virtual stock calculations (subrentals & repairs).
 * 
 * Benefits:
 * - Virtual stock calculations (subrentals add, repairs reduce)
 * - Real-time conflict resolution
 * - Optimized batch calculations
 * - Single source of truth for all stock data
 * - Precise conflict analysis with severity levels
 */

import { useMemo } from 'react';
import { useStockEngine } from '@/hooks/stock/useStockEngine';
import { getWarningTimeframe } from '@/constants/timeframes';
import { ConflictAnalysis } from '@/types/stock';

interface ProjectConflictResult {
  hasConflicts: boolean;
  conflictCount: number;
  conflictDetails: Array<{
    resourceId: string;
    resourceName: string;
    date: string;
    type: 'equipment' | 'crew';
    severity: 'low' | 'medium' | 'high';
    deficit: number;
    effectiveStock: number;
    totalUsed: number;
  }>;
}

interface UseProjectConflictsProps {
  projectId?: string;
  eventIds?: string[];
  crewMemberIds?: string[];
  equipmentIds?: string[];
  dates?: string[];
  selectedOwner?: string;
}

export function useProjectConflicts({
  projectId,
  eventIds,
  crewMemberIds,
  equipmentIds,
  dates,
  selectedOwner
}: UseProjectConflictsProps = {}): ProjectConflictResult {
  
  const { startDate, endDate } = getWarningTimeframe();
  
  // Get conflicts from unified stock engine
  const stockEngine = useStockEngine({
    startDate,
    endDate,
    selectedOwner,
    resourceType: 'equipment', // For now, focusing on equipment conflicts
    equipmentIds
  });

  // Process conflicts with filtering
  const conflictResult = useMemo(() => {
    if (stockEngine.isLoading) {
      return { hasConflicts: false, conflictCount: 0, conflictDetails: [] };
    }

    let relevantConflicts = stockEngine.conflicts;

    // Filter by specific criteria if provided
    if (equipmentIds?.length) {
      relevantConflicts = relevantConflicts.filter(conflict => 
        equipmentIds.includes(conflict.equipmentId)
      );
    }
    
    if (dates?.length) {
      relevantConflicts = relevantConflicts.filter(conflict => 
        dates.includes(conflict.date)
      );
    }

    const conflictDetails = relevantConflicts.map((conflict: ConflictAnalysis) => ({
      resourceId: conflict.equipmentId,
      resourceName: conflict.equipmentName,
      date: conflict.date,
      type: 'equipment' as const,
      severity: conflict.conflict.severity,
      deficit: conflict.conflict.deficit,
      effectiveStock: conflict.stockBreakdown.effectiveStock,
      totalUsed: conflict.stockBreakdown.totalUsed
    }));

    return {
      hasConflicts: conflictDetails.length > 0,
      conflictCount: conflictDetails.length,
      conflictDetails
    };
  }, [stockEngine.conflicts, stockEngine.isLoading, equipmentIds, dates]);

  return conflictResult;
}

/**
 * CREW-SPECIFIC CONFLICT HOOK
 * 
 * TODO: Crew conflicts not yet integrated into unified stock engine
 * This will be redesigned when crew conflicts are added to the stock engine
 */
export function useCrewConflicts(crewMemberIds: string[], dates?: string[]) {
  return useMemo(() => {
    // Placeholder: crew conflicts will be integrated into stock engine later
    return { hasConflicts: false, conflictCount: 0, conflicts: [] };
  }, [crewMemberIds, dates]);
}

/**
 * EVENT-SPECIFIC CONFLICT HOOK
 * 
 * Fast conflict checking for individual events using unified stock engine
 */
export function useEventConflicts(eventId: string, eventDate: Date, equipmentIds?: string[]) {
  const eventDateStr = eventDate.toISOString().split('T')[0];
  
  const stockEngine = useStockEngine({
    startDate: eventDateStr,
    endDate: eventDateStr,
    resourceType: 'equipment',
    equipmentIds
  });

  return useMemo(() => {
    if (stockEngine.isLoading) {
      return { hasConflicts: false, conflictCount: 0 };
    }

    const conflictsOnDate = stockEngine.conflicts.filter(conflict => 
      conflict.date === eventDateStr
    );

    return { 
      hasConflicts: conflictsOnDate.length > 0,
      conflictCount: conflictsOnDate.length,
      conflicts: conflictsOnDate
    };
  }, [stockEngine.conflicts, stockEngine.isLoading, eventDateStr]);
}

/**
 * SECTION-SPECIFIC CONFLICT HOOK
 * 
 * Optimized for event section headers using unified stock engine
 */
export function useSectionConflicts(
  events: Array<{ id: string; date: Date }>, 
  equipmentIds?: string[]
) {
  const dates = useMemo(() => 
    events.map(e => e.date.toISOString().split('T')[0]), 
    [events]
  );

  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  const stockEngine = useStockEngine({
    startDate,
    endDate,
    resourceType: 'equipment',
    equipmentIds
  });

  return useMemo(() => {
    if (stockEngine.isLoading) {
      return { hasConflicts: false, conflictCount: 0, conflicts: [] };
    }

    const relevantConflicts = stockEngine.conflicts.filter(conflict => 
      dates.includes(conflict.date)
    );

    return {
      hasConflicts: relevantConflicts.length > 0,
      conflictCount: relevantConflicts.length,
      conflicts: relevantConflicts
    };
  }, [stockEngine.conflicts, stockEngine.isLoading, dates]);
}