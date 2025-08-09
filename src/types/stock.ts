/**
 * 🎯 UNIFIED STOCK ENGINE TYPES
 * 
 * Core type definitions for the unified stock and conflict management system.
 * Replaces fragmented types across multiple hooks.
 */

import { Database } from "@/integrations/supabase/types";

// =============================================================================
// CORE STOCK TYPES
// =============================================================================

export interface EffectiveStock {
  equipmentId: string;
  equipmentName: string;
  date: string;
  
  // Stock Components
  baseStock: number;           // Equipment.stock
  virtualAdditions: number;    // From subrental orders
  virtualReductions: number;   // From repair orders (future)
  effectiveStock: number;      // Calculated: base + additions - reductions
  
  // Usage Analysis
  totalUsed: number;          // From project bookings
  available: number;          // effectiveStock - totalUsed
  isOverbooked: boolean;      // totalUsed > effectiveStock
  deficit: number;            // Math.max(0, totalUsed - effectiveStock)
}

export interface VirtualStockContribution {
  type: 'subrental' | 'repair';
  orderId: string;
  orderName: string;
  quantity: number;
  startDate: string;
  endDate: string;
  provider?: string;          // For subrentals
  facilityName?: string;      // For repairs
}

export interface StockBreakdown {
  equipmentId: string;
  date: string;
  effectiveStock: EffectiveStock;
  contributions: VirtualStockContribution[];
  bookingDetails: BookingDetail[];
}

export interface BookingDetail {
  eventId: string;
  eventName: string;
  projectName: string;
  quantity: number;
  date: string;
}

// =============================================================================
// CONFLICT ANALYSIS TYPES
// =============================================================================

export interface ConflictAnalysis {
  equipmentId: string;
  equipmentName: string;
  date: string;
  severity: ConflictSeverity;
  
  conflict: {
    deficit: number;            // How many units short
    deficitPercentage: number;  // deficit / totalUsed * 100
    affectedEvents: BookingDetail[];
    potentialSolutions: ConflictSolution[];
  };
  
  stockBreakdown: EffectiveStock;
}

export type ConflictSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface ConflictSolution {
  type: 'subrental' | 'reschedule' | 'substitute' | 'reduce_quantity';
  description: string;
  estimatedCost?: number;
  feasibilityScore: number;    // 0-100
  suggestedProviders?: string[]; // For subrental solutions
}

// =============================================================================
// SUBRENTAL ORDER TYPES
// =============================================================================

export interface SubrentalOrder {
  id: string;
  name: string;                // "Festival Audio Package - Oslo Equipment"
  providerId: string;
  providerName: string;
  startDate: string;
  endDate: string;
  totalCost: number | null;
  status: SubrentalStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Related data
  items: SubrentalOrderItem[];
}

export interface SubrentalOrderItem {
  id: string;
  subrentalOrderId: string;
  equipmentId: string;
  equipmentName: string;       // Denormalized for history
  quantity: number;
  unitCost: number | null;
  temporarySerial?: string;    // "Oslo Equipment MX1 #1"
  notes?: string;
}

export type SubrentalStatus = 'confirmed' | 'delivered' | 'returned' | 'cancelled';

// =============================================================================
// REPAIR ORDER TYPES (FUTURE)
// =============================================================================

export interface RepairOrder {
  id: string;
  name: string;                // "Mixer CDM32 - Power Supply Repair"
  facilityName: string;
  startDate: string;
  estimatedEndDate?: string;
  actualEndDate?: string;
  totalCost: number | null;
  status: RepairStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Related data
  items: RepairOrderItem[];
}

export interface RepairOrderItem {
  id: string;
  repairOrderId: string;
  equipmentId: string;
  equipmentName: string;
  quantity: number;
  serialNumbers?: string[];
  issueDescription?: string;
  estimatedCost?: number;
}

export type RepairStatus = 'in_repair' | 'completed' | 'cancelled';

// =============================================================================
// SUGGESTION TYPES
// =============================================================================

export interface SubrentalSuggestion {
  equipmentId: string;
  equipmentName: string;
  date: string;
  deficit: number;             // How many units needed
  
  conflictAnalysis: ConflictAnalysis;
  suggestedProviders: ProviderSuggestion[];
  estimatedCost: number;
  urgencyScore: number;        // 0-100 based on date proximity and severity
}

export interface ProviderSuggestion {
  providerId: string;
  providerName: string;
  reliabilityRating: number;
  estimatedCost: number;
  geographicMatch: boolean;
  availabilityConfidence: number; // 0-100
}

// =============================================================================
// ENGINE CONFIGURATION
// =============================================================================

export interface StockEngineConfig {
  // Date range for calculations
  dateRange: {
    start: Date;
    end: Date;
  };
  
  // Equipment filtering
  equipmentIds?: string[];
  folderPaths?: string[];
  
  // Features to include
  includeVirtualStock: boolean;
  includeConflictAnalysis: boolean;
  includeSuggestions: boolean;
  
  // Performance settings
  cacheResults: boolean;
  batchSize: number;
}

export interface StockEngineResult {
  // Core data
  stockByEquipmentAndDate: Map<string, Map<string, EffectiveStock>>;
  conflicts: ConflictAnalysis[];
  suggestions: SubrentalSuggestion[];
  
  // Summary data
  totalConflicts: number;
  totalDeficit: number;
  affectedEquipmentCount: number;
  
  // Helper functions
  getEffectiveStock: (equipmentId: string, date: string) => EffectiveStock | null;
  getConflicts: (filters?: ConflictFilters) => ConflictAnalysis[];
  getSuggestions: (filters?: SuggestionFilters) => SubrentalSuggestion[];
  isOverbooked: (equipmentId: string, date: string, additionalUsage?: number) => boolean;
  getAvailability: (equipmentId: string, date: string) => number;
}

// =============================================================================
// FILTER TYPES
// =============================================================================

export interface ConflictFilters {
  severity?: ConflictSeverity[];
  equipmentIds?: string[];
  dateRange?: { start: string; end: string };
  folderPaths?: string[];
}

export interface SuggestionFilters {
  minDeficit?: number;
  maxCost?: number;
  providerId?: string;
  urgencyThreshold?: number;
}

// =============================================================================
// DATABASE TYPES
// =============================================================================

export type DBSubrentalOrder = Database["public"]["Tables"]["subrental_orders"]["Row"];
export type DBSubrentalOrderItem = Database["public"]["Tables"]["subrental_order_items"]["Row"];
export type DBRepairOrder = Database["public"]["Tables"]["repair_orders"]["Row"];
export type DBRepairOrderItem = Database["public"]["Tables"]["repair_order_items"]["Row"];

// =============================================================================
// MIGRATION TYPES
// =============================================================================

export interface MigrationStatus {
  phase: 'planning' | 'database' | 'core_engine' | 'integration' | 'ui' | 'cleanup' | 'complete';
  completedSteps: string[];
  currentStep: string;
  errors: string[];
  dataIntegrityChecks: {
    originalSubrentalCount: number;
    migratedOrderCount: number;
    migratedItemCount: number;
    costTotalMatch: boolean;
  };
}
