/**
 * 🎯 EQUIPMENT STOCK ENGINE - SINGLE SOURCE OF TRUTH
 * 
 * ONE ENGINE FOR ALL EQUIPMENT STOCK OPERATIONS
 * Every component uses the same equipment data - no translation layers, no adapters.
 * 
 * Revolutionary Architecture:
 * - Global state management
 * - Virtual stock calculations (subrentals add, repairs reduce)  
 * - Real-time conflict detection
 * - Unified data model across all views
 * - Automatic consistency everywhere
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { getWarningTimeframe } from '@/constants/timeframes';
import { 
  calculateBatchEffectiveStock, 
  generateDateRange 
} from '@/services/stock/stockCalculations';
import { 
  analyzeConflicts, 
  generateSubrentalSuggestions 
} from '@/services/stock/conflictAnalysis';
import { 
  EffectiveStock, 
  ConflictAnalysis, 
  SubrentalSuggestion 
} from '@/types/stock';

// =============================================================================
// GLOBAL ENGINE INTERFACE
// =============================================================================

interface GlobalStockEngineResult {
  // CORE DATA - Same for everyone
  equipment: Map<string, any>; // equipmentId -> equipment data
  virtualStock: Map<string, Map<string, EffectiveStock>>; // equipmentId -> date -> stock
  conflicts: ConflictAnalysis[];
  suggestions: SubrentalSuggestion[];
  
  // SUMMARY DATA
  totalConflicts: number;
  totalDeficit: number;
  affectedEquipmentCount: number;
  
  // UNIVERSAL METHODS - Every component uses these
  getEquipmentStock: (equipmentId: string, date: string) => EffectiveStock | null;
  getConflicts: (filters?: ConflictFilters) => ConflictAnalysis[];
  getSuggestions: (filters?: SuggestionFilters) => SubrentalSuggestion[];
  isOverbooked: (equipmentId: string, date: string, additionalUsage?: number) => boolean;
  getAvailability: (equipmentId: string, date: string) => number;
  
  // STATUS
  isLoading: boolean;
  error: Error | null;
}

interface ConflictFilters {
  equipmentIds?: string[];
  dates?: string[];
  severities?: ('low' | 'medium' | 'high')[];
  minDeficit?: number;
}

interface SuggestionFilters {
  equipmentIds?: string[];
  dates?: string[];
  minQuantity?: number;
}

// =============================================================================
// THE ONE ENGINE
// =============================================================================

export function useEquipmentStockEngine(): GlobalStockEngineResult {
  
  // GLOBAL TIME RANGE - 30 days standard for entire app
  const { startDate, endDate } = getWarningTimeframe();
  
  // ============================================================================
  // EQUIPMENT DATA - Global for entire app
  // ============================================================================
  
  const { 
    data: equipment = new Map(), 
    isLoading: isLoadingEquipment 
  } = useQuery({
    queryKey: ['global-equipment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('id, name, stock, folder_id, rental_price');
      
      if (error) throw error;
      
      const equipmentMap = new Map();
      data?.forEach(item => equipmentMap.set(item.id, item));
      return equipmentMap;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - equipment changes infrequently
    gcTime: 30 * 60 * 1000,    // 30 minutes
  });

  // ============================================================================
  // VIRTUAL STOCK - Global calculations for entire app
  // ============================================================================
  
  const { 
    data: virtualStock = new Map(), 
    isLoading: isLoadingStock,
    error: stockError 
  } = useQuery({
    queryKey: ['global-virtual-stock', startDate, endDate],
    queryFn: async () => {
      const equipmentIds = Array.from(equipment.keys());
      if (equipmentIds.length === 0) return new Map();
      
      return await calculateBatchEffectiveStock(equipmentIds, startDate, endDate);
    },
    enabled: equipment.size > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes - stock changes more frequently
    gcTime: 15 * 60 * 1000,   // 15 minutes
  });

  // ============================================================================
  // CONFLICTS - Global analysis for entire app
  // ============================================================================
  
  const { 
    data: conflicts = [], 
    isLoading: isLoadingConflicts 
  } = useQuery({
    queryKey: ['global-conflicts', startDate, endDate],
    queryFn: async () => {
      const equipmentIds = Array.from(equipment.keys());
      if (equipmentIds.length === 0) return [];
      
      return await analyzeConflicts(equipmentIds, startDate, endDate);
    },
    enabled: equipment.size > 0,
    staleTime: 3 * 60 * 1000, // 3 minutes - conflicts need frequent updates
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });

  // ============================================================================
  // SUGGESTIONS - Global subrental suggestions for entire app
  // ============================================================================
  
  const { 
    data: suggestions = [], 
    isLoading: isLoadingSuggestions 
  } = useQuery({
    queryKey: ['global-suggestions', startDate, endDate],
    queryFn: async () => {
      if (conflicts.length === 0) return [];
      
      return await generateSubrentalSuggestions(conflicts, startDate, endDate);
    },
    enabled: conflicts.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,   // 15 minutes
  });

  // ============================================================================
  // UNIVERSAL METHODS - Same logic for all components
  // ============================================================================

  const getEquipmentStock = useMemo(() => 
    (equipmentId: string, date: string): EffectiveStock | null => {
      const equipmentStock = virtualStock.get(equipmentId);
      return equipmentStock?.get(date) || null;
    }, 
    [virtualStock]
  );

  const getConflicts = useMemo(() => 
    (filters?: ConflictFilters): ConflictAnalysis[] => {
      let filtered = conflicts;
      
      if (filters?.equipmentIds?.length) {
        filtered = filtered.filter(c => filters.equipmentIds!.includes(c.equipmentId));
      }
      
      if (filters?.dates?.length) {
        filtered = filtered.filter(c => filters.dates!.includes(c.date));
      }
      
      if (filters?.severities?.length) {
        filtered = filtered.filter(c => filters.severities!.includes(c.conflict.severity));
      }
      
      if (filters?.minDeficit) {
        filtered = filtered.filter(c => c.conflict.deficit >= filters.minDeficit!);
      }
      
      return filtered;
    }, 
    [conflicts]
  );

  const getSuggestions = useMemo(() => 
    (filters?: SuggestionFilters): SubrentalSuggestion[] => {
      let filtered = suggestions;
      
      if (filters?.equipmentIds?.length) {
        filtered = filtered.filter(s => filters.equipmentIds!.includes(s.equipmentId));
      }
      
      if (filters?.dates?.length) {
        filtered = filtered.filter(s => filters.dates!.includes(s.date));
      }
      
      if (filters?.minQuantity) {
        filtered = filtered.filter(s => s.requiredQuantity >= filters.minQuantity!);
      }
      
      return filtered;
    }, 
    [suggestions]
  );

  const isOverbooked = useMemo(() => 
    (equipmentId: string, date: string, additionalUsage = 0): boolean => {
      const stock = getEquipmentStock(equipmentId, date);
      if (!stock) return false;
      
      return (stock.totalUsed + additionalUsage) > stock.effectiveStock;
    }, 
    [getEquipmentStock]
  );

  const getAvailability = useMemo(() => 
    (equipmentId: string, date: string): number => {
      const stock = getEquipmentStock(equipmentId, date);
      return stock ? Math.max(0, stock.available) : 0;
    }, 
    [getEquipmentStock]
  );

  // ============================================================================
  // SUMMARY DATA
  // ============================================================================

  const totalConflicts = conflicts.length;
  const totalDeficit = conflicts.reduce((sum, c) => sum + c.conflict.deficit, 0);
  const affectedEquipmentCount = new Set(conflicts.map(c => c.equipmentId)).size;

  // ============================================================================
  // LOADING & ERROR STATE
  // ============================================================================

  const isLoading = isLoadingEquipment || isLoadingStock || isLoadingConflicts || isLoadingSuggestions;
  const error = stockError;

  return {
    // Core data
    equipment,
    virtualStock,
    conflicts,
    suggestions,
    
    // Summary
    totalConflicts,
    totalDeficit,
    affectedEquipmentCount,
    
    // Universal methods
    getEquipmentStock,
    getConflicts,
    getSuggestions,
    isOverbooked,
    getAvailability,
    
    // Status
    isLoading,
    error
  };
}

// =============================================================================
// SPECIALIZED VIEWS OF THE ONE ENGINE
// =============================================================================

/**
 * Dashboard view - uses global engine with dashboard-specific filters
 */
export function useDashboardStock(selectedOwner?: string) {
  const engine = useEquipmentStockEngine();
  
  // Dashboard only cares about conflicts in next 30 days
  const dashboardConflicts = engine.getConflicts({
    severities: ['medium', 'high'] // Only show actionable conflicts
  });
  
  return {
    conflicts: dashboardConflicts,
    suggestions: engine.getSuggestions(),
    totalConflicts: dashboardConflicts.length,
    isLoading: engine.isLoading,
    error: engine.error
  };
}

/**
 * Timeline view - uses global engine with timeline-specific helpers
 */
export function useTimelineStock(equipmentIds: string[], visibleDates: string[]) {
  const engine = useEquipmentStockEngine();
  
  return {
    getStock: engine.getEquipmentStock,
    isOverbooked: engine.isOverbooked,
    getAvailability: engine.getAvailability,
    conflicts: engine.getConflicts({ equipmentIds, dates: visibleDates }),
    suggestions: engine.getSuggestions({ equipmentIds, dates: visibleDates }),
    isLoading: engine.isLoading
  };
}

/**
 * Project view - uses global engine with project-specific filters
 */
export function useProjectStock(equipmentIds: string[], projectDates: string[]) {
  const engine = useEquipmentStockEngine();
  
  const projectConflicts = engine.getConflicts({ 
    equipmentIds, 
    dates: projectDates 
  });
  
  return {
    hasConflicts: projectConflicts.length > 0,
    conflicts: projectConflicts,
    suggestions: engine.getSuggestions({ equipmentIds, dates: projectDates }),
    isLoading: engine.isLoading
  };
}
