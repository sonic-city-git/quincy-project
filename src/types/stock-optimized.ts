/**
 * 🚀 OPTIMIZED STOCK ENGINE INTERFACES
 * 
 * World-class equipment tracking with focused, purpose-built interfaces.
 * Each interface serves specific use cases without bloat.
 */

import { ConflictAnalysis, EffectiveStock, SubrentalSuggestion, EquipmentBooking } from './stock';

// =============================================================================
// FOCUSED ENGINE RESULTS - NO INTERFACE BLOAT
// =============================================================================

/**
 * 🏠 DASHBOARD: Ultra-lightweight conflict data
 */
export interface DashboardConflictResult {
  conflictCount: number;
  urgentConflictCount: number;
  conflicts: ConflictAnalysis[];
  isLoading: boolean;
  error: EngineError | null;
}

/**
 * 📋 PROJECT: Project-scoped conflict resolution
 */
export interface ProjectConflictResult {
  conflicts: ConflictAnalysis[];
  conflictsByDate: Record<string, ConflictAnalysis[]>;
  getConflictsForDate: (date: string) => ConflictAnalysis[];
  getConflictingProjects: (equipmentId: string, date: string) => ProjectConflictInfo[];
  totalConflicts: number;
  isLoading: boolean;
  error: EngineError | null;
}

/**
 * 📅 TIMELINE: Full booking and availability data
 */
export interface TimelineStockResult {
  // Core booking access
  getBooking: (equipmentId: string, date: string) => EquipmentBooking | null;
  getAvailability: (equipmentId: string, date: string) => number;
  isOverbooked: (equipmentId: string, date: string) => boolean;
  
  // Batch data for performance
  bookings: Map<string, EquipmentBooking>;
  conflicts: ConflictAnalysis[];
  suggestions: SubrentalSuggestion[];
  
  // Performance helpers
  getBookingsForDateRange: (equipmentId: string, startDate: string, endDate: string) => EquipmentBooking[];
  preloadEquipmentData: (equipmentIds: string[]) => Promise<void>;
  
  isLoading: boolean;
  error: EngineError | null;
}

/**
 * 🔍 SEARCH: Query-optimized equipment data
 */
export interface SearchStockResult {
  conflicts: ConflictAnalysis[];
  getConflictsByEquipment: (equipmentId: string) => ConflictAnalysis[];
  totalConflictsByEquipment: Record<string, number>;
  isLoading: boolean;
  error: EngineError | null;
}

// =============================================================================
// TIMELINE OPTIMIZED INTERFACE
// =============================================================================

export interface TimelineStockResult {
  // Core stock access
  getEquipmentStock: (equipmentId: string, date: string) => any | null;
  getBooking: (equipmentId: string, date: string) => any | null;
  getAvailability: (equipmentId: string, date: string) => number;
  isOverbooked: (equipmentId: string, date: string) => boolean;
  
  // Batch data
  bookings: Map<string, any>;
  conflicts: any[];
  suggestions: any[];
  
  // Performance helpers
  getBookingsForDateRange: (equipmentId: string, startDate: string, endDate: string) => any[];
  preloadEquipmentData: (equipmentIds: string[]) => Promise<void>;
  
  // Status
  isLoading: boolean;
  error: EngineError | null;
}

// =============================================================================
// SUPPORTING TYPES
// =============================================================================

export interface ProjectConflictInfo {
  projectId: string;
  projectName: string;
  eventName: string;
  quantity: number;
  date: string;
}

export interface EngineError {
  message: string;
  code: 'FETCH_ERROR' | 'CALCULATION_ERROR' | 'VALIDATION_ERROR';
  details?: any;
  timestamp: string;
}

// =============================================================================
// CACHING STRATEGIES
// =============================================================================

export interface CacheStrategy {
  staleTime: number;
  gcTime: number;
  refetchOnWindowFocus: boolean;
  retry: number;
}

export const CACHE_STRATEGIES: Record<string, CacheStrategy> = {
  dashboard: {
    staleTime: 2 * 60 * 1000,        // 2 minutes - counts change slowly
    gcTime: 10 * 60 * 1000,          // 10 minutes
    refetchOnWindowFocus: false,      // Dashboard is overview
    retry: 3
  },
  project: {
    staleTime: 30 * 1000,             // 30 seconds - project-specific changes
    gcTime: 5 * 60 * 1000,            // 5 minutes  
    refetchOnWindowFocus: true,       // Users care about project updates
    retry: 2
  },
  timeline: {
    staleTime: 10 * 1000,             // 10 seconds - real-time planning
    gcTime: 60 * 1000,                // 1 minute
    refetchOnWindowFocus: true,       // Critical for planning
    retry: 1
  },
  search: {
    staleTime: 1 * 60 * 1000,         // 1 minute - search results
    gcTime: 5 * 60 * 1000,            // 5 minutes
    refetchOnWindowFocus: false,      // Search is query-driven
    retry: 2
  }
};

// =============================================================================
// PERFORMANCE CONFIGURATIONS
// =============================================================================

export interface EngineConfig {
  // Data scope
  dateRange: { start: Date; end: Date };
  equipmentIds?: string[];           // Filter to specific equipment
  
  // Feature flags
  includeConflictAnalysis: boolean;
  includeSuggestions: boolean;
  includeVirtualStock: boolean;
  
  // Performance tuning
  cacheStrategy: keyof typeof CACHE_STRATEGIES;
  batchSize: number;
  enablePreloading: boolean;
}
