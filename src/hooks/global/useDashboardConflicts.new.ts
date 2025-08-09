/**
 * 🎯 DASHBOARD CONFLICTS - UNIFIED STOCK ENGINE VERSION
 * 
 * Replaces the old useDashboardConflicts with the new unified stock engine.
 * Provides complete, reliable conflict detection using virtual stock calculations.
 */

import { useMemo } from 'react';
import { useDashboardStockConflicts } from '@/hooks/stock/useStockEngine';
import { ConflictAnalysis } from '@/types/stock';

interface EquipmentConflict {
  equipmentId: string;
  equipmentName: string;
  date: string;
  totalStock: number;
  totalUsed: number;
  overbooked: number;
  conflictingEvents: {
    eventName: string;
    projectName: string;
    quantity: number;
  }[];
}

interface CrewConflict {
  crewMemberId: string;
  crewMemberName: string;
  date: string;
  conflictingAssignments: {
    eventName: string;
    projectName: string;
    role: string;
  }[];
}

export function useDashboardConflicts(selectedOwner?: string) {
  // Use the new unified stock engine
  const stockEngine = useDashboardStockConflicts(selectedOwner);

  // Transform conflicts to match the old interface
  const equipmentConflicts = useMemo((): EquipmentConflict[] => {
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

  // TODO: Crew conflicts will be handled separately (not affected by virtual stock)
  const crewConflicts: CrewConflict[] = [];

  return {
    equipmentConflicts,
    crewConflicts,
    isLoading: (stockEngine as any).isLoading,
    error: (stockEngine as any).error,
    
    // Additional data from new engine
    totalConflicts: stockEngine.totalConflicts,
    totalDeficit: stockEngine.totalDeficit,
    affectedEquipmentCount: stockEngine.affectedEquipmentCount,
    suggestions: stockEngine.suggestions
  };
}
