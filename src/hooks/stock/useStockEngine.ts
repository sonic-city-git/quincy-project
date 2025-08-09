/**
 * 🎯 UNIFIED STOCK ENGINE HOOK
 * 
 * Single source of truth for all stock-related data and calculations.
 * Replaces: useDashboardConflicts, useConsolidatedConflicts, useSubrentalSuggestions,
 *          useProjectConflicts, and fragmented warning logic throughout the app.
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  StockEngineConfig, 
  StockEngineResult, 
  ConflictAnalysis, 
  EffectiveStock,
  ConflictFilters,
  SuggestionFilters,
  SubrentalSuggestion
} from '@/types/stock';
import { 
  calculateBatchEffectiveStock, 
  calculateEffectiveStock,
  generateDateRange,
  isEquipmentOverbooked,
  getAvailableQuantity
} from '@/services/stock/stockCalculations';
import { 
  analyzeConflicts, 
  generateSubrentalSuggestions 
} from '@/services/stock/conflictAnalysis';
import { format } from 'date-fns';

// =============================================================================
// MAIN STOCK ENGINE HOOK
// =============================================================================

export function useStockEngine(config: StockEngineConfig): StockEngineResult {
  const {
    dateRange,
    equipmentIds = [],
    folderPaths = [],
    includeVirtualStock = true,
    includeConflictAnalysis = true,
    includeSuggestions = true,
    cacheResults = true,
    batchSize = 100
  } = config;

  const startDate = format(dateRange.start, 'yyyy-MM-dd');
  const endDate = format(dateRange.end, 'yyyy-MM-dd');

  // ============================================================================
  // EQUIPMENT FILTERING
  // ============================================================================

  const { data: filteredEquipmentIds = [] } = useQuery({
    queryKey: ['stock-engine-equipment-filter', equipmentIds, folderPaths],
    queryFn: async () => {
      // If specific equipment IDs provided, use those
      if (equipmentIds.length > 0) {
        return equipmentIds;
      }

      // Otherwise, get equipment by folder paths
      // TODO: Implement folder-based filtering
      // For now, return empty array if no specific equipment provided
      return [];
    },
    enabled: true,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // ============================================================================
  // CORE STOCK DATA
  // ============================================================================

  const { 
    data: stockData = new Map(), 
    isLoading: isLoadingStock,
    error: stockError 
  } = useQuery({
    queryKey: [
      'stock-engine-core', 
      filteredEquipmentIds, 
      startDate, 
      endDate, 
      includeVirtualStock
    ],
    queryFn: async () => {
      if (filteredEquipmentIds.length === 0) {
        return new Map();
      }

      return await calculateBatchEffectiveStock(
        filteredEquipmentIds, 
        startDate, 
        endDate
      );
    },
    enabled: filteredEquipmentIds.length > 0,
    staleTime: cacheResults ? 5 * 60 * 1000 : 0, // 5 minutes if caching
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  // ============================================================================
  // CONFLICT ANALYSIS
  // ============================================================================

  const { 
    data: conflicts = [], 
    isLoading: isLoadingConflicts 
  } = useQuery({
    queryKey: [
      'stock-engine-conflicts', 
      filteredEquipmentIds, 
      startDate, 
      endDate,
      includeConflictAnalysis
    ],
    queryFn: async () => {
      if (!includeConflictAnalysis || filteredEquipmentIds.length === 0) {
        return [];
      }

      return await analyzeConflicts(
        filteredEquipmentIds, 
        startDate, 
        endDate
      );
    },
    enabled: includeConflictAnalysis && filteredEquipmentIds.length > 0,
    staleTime: cacheResults ? 3 * 60 * 1000 : 0, // 3 minutes if caching
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // ============================================================================
  // SUBRENTAL SUGGESTIONS
  // ============================================================================

  const { 
    data: suggestions = [], 
    isLoading: isLoadingSuggestions 
  } = useQuery({
    queryKey: [
      'stock-engine-suggestions', 
      conflicts, 
      includeSuggestions
    ],
    queryFn: async () => {
      if (!includeSuggestions || conflicts.length === 0) {
        return [];
      }

      return await generateSubrentalSuggestions(conflicts, true);
    },
    enabled: includeSuggestions && conflicts.length > 0,
    staleTime: cacheResults ? 5 * 60 * 1000 : 0, // 5 minutes if caching
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  // ============================================================================
  // DERIVED DATA & HELPER FUNCTIONS
  // ============================================================================

  const result = useMemo((): StockEngineResult => {
    // Summary statistics
    const totalConflicts = conflicts.length;
    const totalDeficit = conflicts.reduce((sum, c) => sum + c.conflict.deficit, 0);
    const affectedEquipmentCount = new Set(conflicts.map(c => c.equipmentId)).size;

    // Helper functions
    const getEffectiveStock = (equipmentId: string, date: string): EffectiveStock | null => {
      return stockData.get(equipmentId)?.get(date) || null;
    };

    const getConflicts = (filters?: ConflictFilters): ConflictAnalysis[] => {
      if (!filters) return conflicts;

      return conflicts.filter(conflict => {
        // Apply severity filter
        if (filters.severity && !filters.severity.includes(conflict.severity)) {
          return false;
        }

        // Apply equipment filter
        if (filters.equipmentIds && !filters.equipmentIds.includes(conflict.equipmentId)) {
          return false;
        }

        // Apply date range filter
        if (filters.dateRange) {
          if (conflict.date < filters.dateRange.start || conflict.date > filters.dateRange.end) {
            return false;
          }
        }

        // Apply folder filter
        if (filters.folderPaths && filters.folderPaths.length > 0) {
          // TODO: Implement folder path checking
          // For now, include all conflicts
        }

        return true;
      });
    };

    const getSuggestions = (filters?: SuggestionFilters): SubrentalSuggestion[] => {
      if (!filters) return suggestions;

      return suggestions.filter(suggestion => {
        // Apply deficit filter
        if (filters.minDeficit && suggestion.deficit < filters.minDeficit) {
          return false;
        }

        // Apply cost filter
        if (filters.maxCost && suggestion.estimatedCost > filters.maxCost) {
          return false;
        }

        // Apply provider filter
        if (filters.providerId) {
          const hasProvider = suggestion.suggestedProviders.some(
            p => p.providerId === filters.providerId
          );
          if (!hasProvider) return false;
        }

        // Apply urgency filter
        if (filters.urgencyThreshold && suggestion.urgencyScore < filters.urgencyThreshold) {
          return false;
        }

        return true;
      });
    };

    const isOverbooked = async (
      equipmentId: string, 
      date: string, 
      additionalUsage = 0
    ): Promise<boolean> => {
      const stock = getEffectiveStock(equipmentId, date);
      if (stock) {
        return (stock.totalUsed + additionalUsage) > stock.effectiveStock;
      }
      
      // Fallback to live calculation
      return await isEquipmentOverbooked(equipmentId, date, additionalUsage);
    };

    const getAvailability = async (equipmentId: string, date: string): Promise<number> => {
      const stock = getEffectiveStock(equipmentId, date);
      if (stock) {
        return Math.max(0, stock.available);
      }
      
      // Fallback to live calculation
      return await getAvailableQuantity(equipmentId, date);
    };

    return {
      // Core data
      stockByEquipmentAndDate: stockData,
      conflicts,
      suggestions,

      // Summary
      totalConflicts,
      totalDeficit,
      affectedEquipmentCount,

      // Helper functions
      getEffectiveStock,
      getConflicts,
      getSuggestions,
      isOverbooked,
      getAvailability
    };
  }, [stockData, conflicts, suggestions]);

  // Include loading states in the result
  (result as any).isLoading = isLoadingStock || isLoadingConflicts || isLoadingSuggestions;
  (result as any).error = stockError;

  return result;
}

// =============================================================================
// SPECIALIZED HOOKS FOR COMMON USE CASES
// =============================================================================

/**
 * Hook for dashboard conflicts (replaces useDashboardConflicts)
 */
export function useDashboardStockConflicts(selectedOwner?: string) {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  // Get all equipment IDs for dashboard (not filtered by expansion state)
  const { data: allEquipmentIds = [] } = useQuery({
    queryKey: ['dashboard-equipment-ids', selectedOwner],
    queryFn: async () => {
      // Get ALL equipment, optionally filtered by owner
      let query = supabase.from('equipment').select('id');
      
      // TODO: Add owner filtering if needed
      // if (selectedOwner) {
      //   query = query.eq('owner_id', selectedOwner);
      // }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return data?.map(eq => eq.id) || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  return useStockEngine({
    dateRange: {
      start: new Date(),
      end: thirtyDaysFromNow
    },
    equipmentIds: allEquipmentIds,
    includeVirtualStock: true,
    includeConflictAnalysis: true,
    includeSuggestions: false, // Dashboard doesn't need suggestions
    cacheResults: true,
    batchSize: 200
  });
}

/**
 * Hook for project-specific conflicts (replaces useProjectConflicts)
 */
export function useProjectStockConflicts(
  projectId: string,
  eventIds: string[],
  equipmentIds: string[]
) {
  // TODO: Calculate date range from project events
  const dateRange = {
    start: new Date(),
    end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
  };

  return useStockEngine({
    dateRange,
    equipmentIds,
    includeVirtualStock: true,
    includeConflictAnalysis: true,
    includeSuggestions: true,
    cacheResults: true,
    batchSize: 50
  });
}

/**
 * Hook for timeline/planner conflicts (replaces parts of useTimelineHub)
 */
export function useTimelineStockEngine(
  equipmentIds: string[],
  visibleDateRange: { start: Date; end: Date }
) {
  return useStockEngine({
    dateRange: visibleDateRange,
    equipmentIds,
    includeVirtualStock: true,
    includeConflictAnalysis: true,
    includeSuggestions: true,
    cacheResults: true,
    batchSize: 100
  });
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Get effective stock for single equipment/date (optimized for individual lookups)
 */
export function useEffectiveStock(equipmentId: string, date: string) {
  return useQuery({
    queryKey: ['effective-stock', equipmentId, date],
    queryFn: () => calculateEffectiveStock(equipmentId, date),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!equipmentId && !!date
  });
}
