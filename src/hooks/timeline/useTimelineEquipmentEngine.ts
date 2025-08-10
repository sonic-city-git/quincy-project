/**
 * 🎯 TIMELINE EQUIPMENT ENGINE WRAPPER
 * 
 * SIMPLIFIED wrapper around the main Equipment Engine for timeline-specific needs.
 * ELIMINATES ALL manual stock/conflict calculations from useTimelineHub.
 * 
 * Before: 964 lines of manual equipment logic
 * After: Clean wrapper using ONE ENGINE
 */

import { useMemo } from 'react';
import { useEquipmentStockEngine } from '@/hooks/useEquipmentStockEngine';
import { ConflictAnalysis } from '@/types/stock';

interface TimelineEquipmentData {
  // CONFLICTS - filtered to visible equipment and dates
  conflicts: ConflictAnalysis[];
  
  // WARNINGS - 30-day window  
  warnings: TimelineWarning[];
  
  // HELPER METHODS
  isOverbooked: (equipmentId: string, date: string, additionalUsage?: number) => boolean;
  getAvailability: (equipmentId: string, date: string) => number;
  getConflictsForEquipment: (equipmentId: string, dates?: string[]) => ConflictAnalysis[];
  
  // STATUS
  isLoading: boolean;
  error: Error | null;
}

interface TimelineWarning {
  resourceId: string;
  resourceName: string;
  date: string;
  type: 'overbooked' | 'resolved';
  severity: 'low' | 'medium' | 'high';
  details: {
    stock: number;
    used: number;
    overbooked: number;
    virtualAdditions?: number; // NEW: Show virtual stock contributions
    events: any[];
  };
}

/**
 * 🎯 TIMELINE EQUIPMENT ENGINE
 * 
 * Provides equipment data for timeline views with performance optimizations.
 * ALL data comes from the ONE ENGINE - no manual calculations.
 */
export function useTimelineEquipmentEngine(
  equipmentIds: string[], 
  visibleDates: string[]
): TimelineEquipmentData {
  
  const engine = useEquipmentStockEngine();
  
  // FILTER conflicts to visible equipment and dates
  const conflicts = useMemo(() => {
    return engine.getConflicts({
      equipmentIds: equipmentIds.length > 0 ? equipmentIds : undefined,
      dates: visibleDates.length > 0 ? visibleDates : undefined
    });
  }, [engine.getConflicts, equipmentIds, visibleDates]);
  
  // TRANSFORM conflicts to timeline warnings format (for backward compatibility)
  const warnings = useMemo((): TimelineWarning[] => {
    return conflicts.map(conflict => {
      // Determine warning type based on virtual stock
      const type = conflict.conflict.deficit > 0 ? 'overbooked' : 'resolved';
      
      // Calculate severity based on deficit percentage
      const deficitRatio = conflict.stockBreakdown.effectiveStock > 0 
        ? conflict.conflict.deficit / conflict.stockBreakdown.effectiveStock
        : 1;
      
      let severity: 'low' | 'medium' | 'high' = 'low';
      if (deficitRatio > 0.5) severity = 'high';
      else if (deficitRatio > 0.2) severity = 'medium';
      
      return {
        resourceId: conflict.equipmentId,
        resourceName: conflict.equipmentName,
        date: conflict.date,
        type,
        severity,
        details: {
          stock: conflict.stockBreakdown.effectiveStock,
          used: conflict.stockBreakdown.totalUsed,
          overbooked: conflict.conflict.deficit,
          virtualAdditions: conflict.stockBreakdown.virtualAdditions, // NEW!
          events: conflict.conflict.affectedEvents || []
        }
      };
    });
  }, [conflicts]);
  
  // HELPER: Get conflicts for specific equipment
  const getConflictsForEquipment = useMemo(() => 
    (equipmentId: string, dates?: string[]): ConflictAnalysis[] => {
      return engine.getConflicts({
        equipmentIds: [equipmentId],
        dates
      });
    }, 
    [engine.getConflicts]
  );
  
  return {
    conflicts,
    warnings,
    
    // Pass through engine methods
    isOverbooked: engine.isOverbooked,
    getAvailability: engine.getAvailability,
    getConflictsForEquipment,
    
    // Pass through status
    isLoading: engine.isLoading,
    error: engine.error
  };
}

/**
 * 🎯 CREW-SPECIFIC TIMELINE HOOK (for future Crew Engine)
 * 
 * For now, return placeholder data since crew logic stays separate.
 */
export function useTimelineCrewEngine(
  crewIds: string[], 
  visibleDates: string[]
) {
  return {
    conflicts: [],
    warnings: [],
    isLoading: false,
    error: null,
    // TODO: Will be implemented when we create the Crew Engine
  };
}
