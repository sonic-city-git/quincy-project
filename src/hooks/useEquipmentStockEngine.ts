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
import { CACHE_STRATEGIES } from '@/types/stock-optimized';

// =============================================================================
// CACHE CONFIGURATION HELPER
// =============================================================================

function getCacheConfig(strategy: string, cacheResults: boolean) {
  if (!cacheResults) {
    return { staleTime: 0, gcTime: 1000 }; // Minimal caching
  }
  
  return CACHE_STRATEGIES[strategy] || CACHE_STRATEGIES.timeline;
}

// =============================================================================
// GLOBAL ENGINE INTERFACE
// =============================================================================

// Timeline-specific data structures
interface EquipmentBooking {
  equipmentId: string;
  equipmentName: string;
  date: string;
  stock: number;
  totalUsed: number;
  isOverbooked: boolean;
  folderPath: string;
  bookings: Array<{
    id: string;
    quantity: number;
    projectName: string;
    eventName: string;
    eventType: string;
    eventTypeColor: string;
    location?: string;
  }>;
}

interface EquipmentProjectUsage {
  equipmentId: string;
  projectNames: string[];
  projectQuantities: Map<string, Map<string, {
    date: string;
    quantity: number;
    eventName: string;
    projectName: string;
  }>>;
}

interface GlobalStockEngineResult {
  // CORE DATA - Same for everyone
  equipment: Map<string, any>; // equipmentId -> equipment data
  virtualStock: Map<string, Map<string, EffectiveStock>>; // equipmentId -> date -> stock
  conflicts: ConflictAnalysis[];
  suggestions: SubrentalSuggestion[];
  
  // TIMELINE DATA - Project assignments and bookings
  bookings: Map<string, EquipmentBooking>; // "equipmentId-date" -> booking details
  projectUsage: Map<string, EquipmentProjectUsage>; // equipmentId -> project usage
  
  // DATE RANGE - For Timeline debugging and validation
  startDate: string;
  endDate: string;
  
  // SUMMARY DATA
  totalConflicts: number;
  totalDeficit: number;
  affectedEquipmentCount: number;
  
  // UNIVERSAL METHODS - Every component uses these
  getEquipmentStock: (equipmentId: string, date: string) => EffectiveStock | null;
  getBooking: (equipmentId: string, date: string) => EquipmentBooking | null;
  getProjectUsage: (equipmentId: string) => EquipmentProjectUsage | null;
  getProjectQuantityForDate: (projectName: string, equipmentId: string, date: string) => { date: string; quantity: number; eventName: string; projectName: string } | null;
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
  severities?: ('critical' | 'high' | 'medium' | 'low')[];
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
  
  // OPTIONAL: Feature flags
  includeVirtualStock?: boolean;
  includeConflictAnalysis?: boolean;
  includeSuggestions?: boolean;
  
  // OPTIONAL: Performance tuning
  cacheResults?: boolean;
  batchSize?: number;
  
  // 🚀 NEW: Caching strategy selection
  cacheStrategy?: 'dashboard' | 'project' | 'timeline' | 'search';
}

export function useEquipmentStockEngine(config: EquipmentEngineConfig): GlobalStockEngineResult {
  const {
    dateRange,
    includeVirtualStock = true,
    includeConflictAnalysis = true,
    includeSuggestions = false,
    cacheResults = true,
    batchSize = 100,
    cacheStrategy = 'timeline'
  } = config;
  
  const startDate = format(dateRange.start, 'yyyy-MM-dd');
  const endDate = format(dateRange.end, 'yyyy-MM-dd');
  
  // ============================================================================
  // EQUIPMENT DATA - Global for entire app
  // ============================================================================
  
  // ============================================================================
  // EQUIPMENT DATA - ALWAYS GLOBAL, NEVER FILTERED
  // All users see all equipment and all problems at all times
  // ============================================================================
  
  const { 
    data: equipment = new Map(), 
    isLoading: isLoadingEquipment 
  } = useQuery({
    queryKey: ['equipment-global'], // ✅ FIXED: Global cache key, no filters
    queryFn: async () => {
      // ✅ ALWAYS load ALL equipment with folder information
      const [equipmentResult, foldersResult] = await Promise.all([
        supabase.from('equipment')
          .select('id, name, stock, folder_id, rental_price')
          .order('name'),
        supabase.from('equipment_folders')
          .select('*')
      ]);
      
      if (equipmentResult.error) throw equipmentResult.error;
      if (foldersResult.error) throw foldersResult.error;
      
      // Build folder map for folder path calculation
      const folderMap = new Map(foldersResult.data?.map(f => [f.id, f]) || []);
      
      const equipmentMap = new Map();
      (equipmentResult.data || []).forEach(item => {
        const folder = folderMap.get(item.folder_id);
        const parentFolder = folder?.parent_id ? folderMap.get(folder.parent_id) : null;
        
        const mainFolder = parentFolder?.name || folder?.name || 'Uncategorized';
        const subFolder = folder?.parent_id ? folder.name : undefined;
        const folderPath = subFolder ? `${mainFolder}/${subFolder}` : mainFolder;
        
        equipmentMap.set(item.id, {
          ...item,
          folderPath,
          mainFolder,
          subFolder
        });
      });
      
      return equipmentMap;
    },
    enabled: true,
    staleTime: getCacheConfig(cacheStrategy, cacheResults).staleTime,
    gcTime: getCacheConfig(cacheStrategy, cacheResults).gcTime,
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
      
      const result = await calculateBatchEffectiveStock(filteredEquipmentIds, startDate, endDate);
      
      return result;
    },
    enabled: includeVirtualStock && equipment.size > 0,
    staleTime: getCacheConfig(cacheStrategy, cacheResults).staleTime,
    gcTime: getCacheConfig(cacheStrategy, cacheResults).gcTime,
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
      
      const conflictsResult = await analyzeConflicts(filteredEquipmentIds, startDate, endDate);
      
      return conflictsResult;
    },
    enabled: (() => {
      const isEnabled = includeConflictAnalysis && equipment.size > 0;
      // Debug removed
      return isEnabled;
    })(),
    staleTime: getCacheConfig(cacheStrategy, cacheResults).staleTime,
    gcTime: getCacheConfig(cacheStrategy, cacheResults).gcTime,
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
      
      return await generateSubrentalSuggestions(conflicts);
    },
    enabled: includeSuggestions && conflicts.length > 0,
    staleTime: getCacheConfig(cacheStrategy, cacheResults).staleTime,
    gcTime: getCacheConfig(cacheStrategy, cacheResults).gcTime,
  });

  // ============================================================================
  // PROJECT BOOKINGS - Equipment assignment details for Timeline
  // ============================================================================
  
  const { 
    data: rawBookings = new Map(), 
    isLoading: isLoadingBookings 
  } = useQuery({
    queryKey: ['project-bookings', Array.from(equipment.keys()), startDate, endDate],
    queryFn: async () => {
      const equipmentIds = Array.from(equipment.keys());
      
      
      if (equipmentIds.length === 0) return new Map();
      
      const { data: eventEquipment, error } = await supabase
        .from('project_event_equipment')
        .select(`
          id, equipment_id, quantity,
          project_events!inner(name, date, location, projects(name), event_types(name, color))
        `)
        .gte('project_events.date', startDate)
        .lte('project_events.date', endDate)
        .neq('project_events.status', 'cancelled')
        .in('equipment_id', equipmentIds);

      if (error) throw error;



      const bookingsByKey = new Map();
      
      eventEquipment?.forEach(booking => {
        if (!booking.equipment_id || !booking.project_events) return;
        
        const key = `${booking.equipment_id}-${booking.project_events.date}`;
        
        if (!bookingsByKey.has(key)) {
          const equipmentData = equipment.get(booking.equipment_id);
          bookingsByKey.set(key, {
            equipmentId: booking.equipment_id,
            equipmentName: equipmentData?.name || 'Unknown',
            date: booking.project_events.date,
            stock: equipmentData?.stock || 0,
            totalUsed: 0,
            isOverbooked: false,
            folderPath: equipmentData?.folderPath || 'Unknown',
            bookings: []
          });
        }
        
        const bookingData = bookingsByKey.get(key);
        const eventTypeColor = booking.project_events.event_types?.color || '#6B7280';
        const eventTypeName = booking.project_events.event_types?.name || 'Unknown';
        
        bookingData.bookings.push({
          id: booking.id,
          quantity: booking.quantity || 0,
          projectName: booking.project_events.projects?.name || 'Unknown',
          eventName: booking.project_events.name || 'Unknown',
          eventType: eventTypeName,
          eventTypeColor: eventTypeColor,
          location: booking.project_events.location
        });
        
        bookingData.totalUsed += booking.quantity || 0;
      });

      return bookingsByKey;
    },
    enabled: equipment.size > 0,
    staleTime: getCacheConfig(cacheStrategy, cacheResults).staleTime,
    gcTime: getCacheConfig(cacheStrategy, cacheResults).gcTime,
  });

  // ============================================================================
  // PROJECT USAGE - Equipment project usage summary for Timeline expansion
  // ============================================================================
  
  const projectUsage = useMemo(() => {
    const usage = new Map();
    
    rawBookings.forEach((booking, key) => {
      const equipmentId = booking.equipmentId;
      
      if (!usage.has(equipmentId)) {
        usage.set(equipmentId, {
          equipmentId,
          projectNames: [],
          projectQuantities: new Map()
        });
      }
      
      const equipmentUsage = usage.get(equipmentId);
      
      booking.bookings?.forEach(b => {
        if (!equipmentUsage.projectNames.includes(b.projectName)) {
          equipmentUsage.projectNames.push(b.projectName);
        }
        
        if (!equipmentUsage.projectQuantities.has(b.projectName)) {
          equipmentUsage.projectQuantities.set(b.projectName, new Map());
        }
        
        const projectQuantities = equipmentUsage.projectQuantities.get(b.projectName);
        const existing = projectQuantities.get(booking.date);
        
        if (existing) {
          existing.quantity += b.quantity;
        } else {
          projectQuantities.set(booking.date, {
            date: booking.date,
            quantity: b.quantity,
            eventName: b.eventName,
            projectName: b.projectName
          });
        }
      });
    });

    return usage;
  }, [rawBookings]);

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

  // ============================================================================
  // ENHANCED BOOKINGS - Merge stock calculations with project details  
  // ============================================================================
  
  const bookings = useMemo(() => {
    const enhanced = new Map();
    
    // Add bookings with stock calculations
    rawBookings.forEach((booking, key) => {
      const [equipmentId, date] = key.split('-');
      const stockData = getEquipmentStock(equipmentId, date);
      
      enhanced.set(key, {
        ...booking,
        stock: stockData?.effectiveStock || booking.stock,
        totalUsed: stockData?.totalUsed || booking.totalUsed,
        available: stockData?.available ?? (booking.stock - booking.totalUsed), // ✅ ADD: Include available (can be negative)
        isOverbooked: stockData?.isOverbooked || false
      });
    });
    
    return enhanced;
  }, [rawBookings, getEquipmentStock]);

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
        filtered = filtered.filter(c => filters.severities!.includes(c.severity));
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
        filtered = filtered.filter(s => s.deficit >= filters.minQuantity!);
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

  const getBooking = useMemo(() => 
    (equipmentId: string, date: string): EquipmentBooking | null => {
      const key = `${equipmentId}-${date}`;
      return bookings.get(key) || null;
    }, 
    [bookings]
  );

  const getProjectUsage = useMemo(() => 
    (equipmentId: string): EquipmentProjectUsage | null => {
      return projectUsage.get(equipmentId) || null;
    }, 
    [projectUsage]
  );

  const getProjectQuantityForDate = useMemo(() => 
    (projectName: string, equipmentId: string, date: string) => {
      const usage = projectUsage.get(equipmentId);
      if (!usage) return null;
      
      const projectQuantities = usage.projectQuantities.get(projectName);
      return projectQuantities?.get(date) || null;
    }, 
    [projectUsage]
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

  const isLoading = isLoadingEquipment || isLoadingStock || isLoadingConflicts || isLoadingSuggestions || isLoadingBookings;
  const error = stockError;
  


  return {
    // Core data
    equipment,
    virtualStock,
    conflicts,
    suggestions,
    
    // Timeline data
    bookings,
    projectUsage,
    
    // Date range
    startDate,
    endDate,
    
    // Summary
    totalConflicts,
    totalDeficit,
    affectedEquipmentCount,
    
    // Universal methods
    getEquipmentStock,
    getBooking,
    getProjectUsage,
    getProjectQuantityForDate,
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

// ❌ REMOVED: useDashboardStock - replaced by useDashboardConflicts wrapper

// ❌ REMOVED: useTimelineStock - replaced by optimized wrapper

// ❌ REMOVED: useProjectStock - replaced by useProjectConflicts wrapper

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
    batchSize: 20,                 // Small batches for quick results
    cacheStrategy: 'search'        // ✅ FIXED: Apply search caching strategy
  });
}
