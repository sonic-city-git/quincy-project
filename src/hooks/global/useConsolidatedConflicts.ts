/**
 * CONSOLIDATED CONFLICTS HOOK - UNIFIED STOCK ENGINE VERSION
 * 
 * ✅ MIGRATED TO UNIFIED STOCK ENGINE
 * 
 * Now provides equipment and crew conflict data using the new unified stock engine
 * for more accurate virtual stock calculations including subrentals and repairs.
 * 
 * Key Benefits:
 * - Single source of truth via useStockEngine
 * - Virtual stock calculations (subrentals add, repairs reduce)
 * - Optimized batch calculations
 * - Consistent 30-day timeframe across app
 * - Real-time conflict resolution
 */

import { useMemo } from 'react';
import { useStockEngine } from '@/hooks/stock/useStockEngine';
import { getWarningTimeframe } from '@/constants/timeframes';
import { ConflictAnalysis } from '@/types/stock';

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

  // Use unified stock engine for equipment conflicts
  const stockEngine = useStockEngine({
    dateRange: {
      start: new Date(startDate),
      end: new Date(endDate)
    },
    includeVirtualStock: true,
    includeConflictAnalysis: true,
    includeSuggestions: true,
    cacheResults: true,
    batchSize: 100
  });

  // Transform stock engine conflicts to backward-compatible format
  const equipmentConflictDetails = useMemo((): Array<{
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
  }> => {
    return stockEngine.conflicts.map((conflict: ConflictAnalysis) => ({
      equipmentId: conflict.equipmentId,
      equipmentName: conflict.equipmentName,
      date: conflict.date,
      totalStock: conflict.stockBreakdown.effectiveStock, // Now includes virtual stock!
      totalUsed: conflict.stockBreakdown.totalUsed,
      overbooked: conflict.conflict.deficit,
      conflictingEvents: conflict.conflict.affectedEvents.map(event => ({
        eventName: event.eventName,
        projectName: event.projectName,
        quantity: event.quantity
      }))
    }));
  }, [stockEngine.conflicts]);

  // TODO: Crew conflicts not yet integrated into stock engine
  // For now, return empty array - this will be addressed in a future phase
  const crewConflictDetails = useMemo(() => {
    // Placeholder: crew conflicts will be integrated into stock engine later
    return [];
  }, []);

  // Dashboard-compatible counts
  const equipmentConflicts = equipmentConflictDetails.length;
  const crewConflicts = crewConflictDetails.length;

  // Loading state from stock engine
  const isLoading = stockEngine.isLoading;

  return {
    equipmentConflicts,
    crewConflicts,
    equipmentConflictDetails,
    crewConflictDetails,
    plannerWarnings: stockEngine.conflicts, // Raw conflicts for advanced use cases
    isLoading
  };
}

/**
 * EQUIPMENT-ONLY CONFLICTS HOOK - UNIFIED STOCK ENGINE VERSION
 * 
 * ✅ MIGRATED TO UNIFIED STOCK ENGINE
 * 
 * Optimized version for dashboard components that only need equipment conflicts.
 * Now uses unified stock engine for accurate virtual stock calculations.
 */
export function useEquipmentConflicts(selectedOwner?: string) {
  const { startDate, endDate } = getWarningTimeframe();
  
  const stockEngine = useStockEngine({
    dateRange: {
      start: new Date(startDate),
      end: new Date(endDate)
    },
    includeVirtualStock: true,
    includeConflictAnalysis: true,
    includeSuggestions: true,
    cacheResults: true,
    batchSize: 100
  });

  return useMemo(() => {
    return {
      conflicts: stockEngine.conflicts.map((conflict: ConflictAnalysis) => ({
        equipmentId: conflict.equipmentId,
        equipmentName: conflict.equipmentName,
        date: conflict.date,
        totalStock: conflict.stockBreakdown.effectiveStock, // Now includes virtual stock!
        totalUsed: conflict.stockBreakdown.totalUsed,
        overbooked: conflict.conflict.deficit,
        conflictingEvents: conflict.conflict.affectedEvents.map(event => ({
          eventName: event.eventName,
          projectName: event.projectName,
          quantity: event.quantity
        }))
      })),
      conflictCount: stockEngine.conflicts.length,
      isLoading: stockEngine.isLoading
    };
  }, [stockEngine.conflicts, stockEngine.isLoading]);
}