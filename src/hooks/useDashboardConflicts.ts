/**
 * 🏠 DASHBOARD CONFLICTS - WORLD-CLASS OPTIMIZATION
 * 
 * Ultra-lightweight with smart caching and optimized for dashboard performance.
 * Provides both counts and conflict display data efficiently.
 */

import { useMemo } from 'react';
import { useEquipmentStockEngine } from './useEquipmentStockEngine';
import { getWarningTimeframe } from '@/constants/timeframes';
import { 
  DashboardConflictResult, 
  EngineError,
  CACHE_STRATEGIES 
} from '@/types/stock-optimized';
import { ConflictAnalysis } from '@/types/stock';

export function useDashboardConflicts(selectedOwner?: string): DashboardConflictResult {
  const { startDate, endDate } = getWarningTimeframe();
  
  // 🚀 OPTIMIZED: Use dashboard-specific caching strategy
  const {
    conflicts,
    isLoading,
    error
  } = useEquipmentStockEngine({
    dateRange: { start: new Date(startDate), end: new Date(endDate) },
    includeConflictAnalysis: true,
    includeSuggestions: false,     // Dashboard doesn't need suggestions
    cacheResults: true,            // Heavy caching for dashboard
    batchSize: 200                 // Larger batches for overview
  });

  // EFFICIENT: Process conflicts once for both counts and display
  const processedConflicts = useMemo(() => {
    if (!conflicts?.length) {
      return { 
        filteredConflicts: [], 
        conflictCount: 0, 
        urgentConflictCount: 0 
      };
    }
    
    // TODO: Apply owner filtering if needed (post-process for now)
    const filteredConflicts = selectedOwner 
      ? conflicts.filter(c => {
          // Filter by owner - implement when needed
          return true; // For now, show all
        })
      : conflicts;
    
    return {
      filteredConflicts,
      conflictCount: filteredConflicts.length,
      urgentConflictCount: filteredConflicts.filter(c => 
        c.severity === 'critical' || c.severity === 'high'
      ).length
    };
  }, [conflicts, selectedOwner]);

  // 🚀 STANDARDIZED ERROR HANDLING
  const engineError: EngineError | null = error ? {
    message: error.message,
    code: 'FETCH_ERROR',
    details: error,
    timestamp: new Date().toISOString()
  } : null;

  return {
    conflictCount: processedConflicts.conflictCount,
    urgentConflictCount: processedConflicts.urgentConflictCount,
    conflicts: processedConflicts.filteredConflicts,
    isLoading,
    error: engineError
  };
}
