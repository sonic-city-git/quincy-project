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

interface EquipmentEngineConfig {
  // REQUIRED: Each component defines its date needs
  dateRange: { start: Date; end: Date };
  
  // OPTIONAL: Scope filtering
  equipmentIds?: string[];
  selectedOwner?: string;
  folderPaths?: string[];
  
  // OPTIONAL: Feature flags
  includeVirtualStock?: boolean;
  includeConflictAnalysis?: boolean;
  includeSuggestions?: boolean;
  
  // OPTIONAL: Performance tuning
  cacheResults?: boolean;
  batchSize?: number;
}

export function useEquipmentStockEngine(config: EquipmentEngineConfig): GlobalStockEngineResult {
  const {
    dateRange,
    equipmentIds,
    selectedOwner,
    folderPaths,
    includeVirtualStock = true,
    includeConflictAnalysis = true,
    includeSuggestions = false,
    cacheResults = true,
    batchSize = 100
  } = config;
  
  const startDate = format(dateRange.start, 'yyyy-MM-dd');
  const endDate = format(dateRange.end, 'yyyy-MM-dd');
  
  // ============================================================================
  // EQUIPMENT DATA - Global for entire app
  // ============================================================================
  
  const { 
    data: equipment = new Map(), 
    isLoading: isLoadingEquipment 
  } = useQuery({
    queryKey: ['equipment-filtered', equipmentIds, selectedOwner, folderPaths],
    queryFn: async () => {
      let query = supabase
        .from('equipment')
        .select('id, name, stock, folder_id, rental_price')
        .order('name');
      
      // Filter by specific equipment IDs if provided
      if (equipmentIds && equipmentIds.length > 0) {
        query = query.in('id', equipmentIds);
      }
      
      // Filter by owner if provided  
      if (selectedOwner) {
        query = query.eq('owner_id', selectedOwner);
      }
      
      // TODO: Add folder filtering when needed
      // if (folderPaths && folderPaths.length > 0) {
      //   query = query.in('folder_path', folderPaths);
      // }
      
      const { data, error } = await query;
      if (error) throw error;
      
      const equipmentMap = new Map();
      data?.forEach(item => equipmentMap.set(item.id, item));
      return equipmentMap;
    },
    enabled: true,
    staleTime: cacheResults ? 10 * 60 * 1000 : 1 * 60 * 1000, // Configurable caching
    gcTime: cacheResults ? 30 * 60 * 1000 : 5 * 60 * 1000,
  });

  // ============================================================================
  // VIRTUAL STOCK - Calculated for filtered equipment and date range
  // ============================================================================
  
  const { 
    data: virtualStock = new Map(), 
    isLoading: isLoadingStock,
    error: stockError 
  } = useQuery({
    queryKey: ['virtual-stock', Array.from(equipment.keys()), startDate, endDate, includeVirtualStock],
    queryFn: async () => {
      if (!includeVirtualStock) return new Map();
      
      const filteredEquipmentIds = Array.from(equipment.keys());
      if (filteredEquipmentIds.length === 0) return new Map();
      
      return await calculateBatchEffectiveStock(filteredEquipmentIds, startDate, endDate);
    },
    enabled: includeVirtualStock && equipment.size > 0,
    staleTime: cacheResults ? 5 * 60 * 1000 : 30 * 1000, // Configurable caching
    gcTime: cacheResults ? 15 * 60 * 1000 : 2 * 60 * 1000,
  });

  // ============================================================================
  // CONFLICTS - Global analysis for entire app
  // ============================================================================
  
  const { 
    data: conflicts = [], 
    isLoading: isLoadingConflicts 
  } = useQuery({
    queryKey: ['conflicts', Array.from(equipment.keys()), startDate, endDate, includeConflictAnalysis],
    queryFn: async () => {
      if (!includeConflictAnalysis) return [];
      
      const filteredEquipmentIds = Array.from(equipment.keys());
      if (filteredEquipmentIds.length === 0) return [];
      
      return await analyzeConflicts(filteredEquipmentIds, startDate, endDate);
    },
    enabled: includeConflictAnalysis && equipment.size > 0,
    staleTime: cacheResults ? 3 * 60 * 1000 : 15 * 1000, // Configurable caching
    gcTime: cacheResults ? 10 * 60 * 1000 : 1 * 60 * 1000,
  });

  // ============================================================================
  // SUGGESTIONS - Subrental suggestions for filtered conflicts
  // ============================================================================
  
  const { 
    data: suggestions = [], 
    isLoading: isLoadingSuggestions 
  } = useQuery({
    queryKey: ['suggestions', conflicts, includeSuggestions],
    queryFn: async () => {
      if (!includeSuggestions || conflicts.length === 0) return [];
      
      return await generateSubrentalSuggestions(conflicts, startDate, endDate);
    },
    enabled: includeSuggestions && conflicts.length > 0,
    staleTime: cacheResults ? 5 * 60 * 1000 : 30 * 1000, // Configurable caching
    gcTime: cacheResults ? 15 * 60 * 1000 : 2 * 60 * 1000,
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
// PAGE-LEVEL WRAPPER HOOKS - ONE PER MAIN PAGE
// =============================================================================

/**
 * 🏠 DASHBOARD: Fixed 30-day window with heavy caching
 */
export function useDashboardStock(selectedOwner?: string) {
  const { startDate, endDate } = getWarningTimeframe(); // Always 30 days
  
  return useEquipmentStockEngine({
    dateRange: { start: new Date(startDate), end: new Date(endDate) },
    selectedOwner,
    includeConflictAnalysis: true,
    includeSuggestions: false,     // Dashboard doesn't need suggestions
    cacheResults: true,            // Heavy caching for overview
    batchSize: 200                 // Large batches for overview
  });
}

/**
 * Timeline view - uses global engine with timeline-specific helpers
 */
export function useTimelineStock(visibleRange: { start: Date; end: Date }) {
  return useEquipmentStockEngine({
    dateRange: visibleRange,       // User-controlled scrolling range
    includeConflictAnalysis: true,
    includeSuggestions: true,      // Timeline shows suggestions
    cacheResults: false,           // Less caching (range changes frequently)
    batchSize: 50                  // Small batches for responsiveness
  });
}

/**
 * Project view - uses global engine with project-specific filters
 */
export function useProjectStock(projectId: string) {
  // TODO: Get project date range from projectId
  const { startDate, endDate } = getWarningTimeframe(); // Temporary fallback
  
  return useEquipmentStockEngine({
    dateRange: { start: new Date(startDate), end: new Date(endDate) }, // Will be project-specific
    includeConflictAnalysis: true,
    includeSuggestions: true,      // Projects need subrental suggestions
    cacheResults: true,            // Moderate caching
    batchSize: 100                 // Balanced batching
  });
}

/**
 * 🔍 GLOBAL SEARCH: Query-driven with fast results  
 */
export function useGlobalSearchStock(query: string) {
  const { startDate, endDate } = getWarningTimeframe(); // 30-day context
  
  return useEquipmentStockEngine({
    dateRange: { start: new Date(startDate), end: new Date(endDate) },
    includeConflictAnalysis: true,
    includeSuggestions: false,     // Search doesn't need suggestions
    cacheResults: true,            // Cache search results
    batchSize: 20                  // Small batches for quick results
  });
}
