// Project Variants Type Definitions
// Supports artist project configurations like Trio, Band, DJ setups

import { Database } from "@/integrations/supabase/types";

// Base variant types from database
export type ProjectVariant = Database["public"]["Tables"]["project_variants"]["Row"];
export type CreateProjectVariantData = Database["public"]["Tables"]["project_variants"]["Insert"];
export type UpdateProjectVariantData = Database["public"]["Tables"]["project_variants"]["Update"];

// Enhanced variant with computed properties
export interface ProjectVariantWithCounts extends ProjectVariant {
  crew_roles_count: number;
  equipment_count: number;
  total_equipment_value: number;
  last_used?: string; // ISO date string
}

// Variant creation payload for UI
export interface CreateVariantPayload {
  variant_name: string;
  description?: string;
  sort_order?: number;
}

// Variant update payload for UI
export interface UpdateVariantPayload {
  id: string;
  variant_name?: string;
  description?: string;
  sort_order?: number;
}

// Resource data filtered by variant
export interface VariantResourceData {
  crew_roles: VariantCrewRole[];
  equipment_groups: VariantEquipmentGroup[];
  equipment_ungrouped: VariantEquipmentItem[];
}

// Crew roles for a specific variant
export interface VariantCrewRole {
  id: string;
  project_id: string;
  variant_id: string;  // ✅ Fixed: Now uses variant_id instead of variant_name
  role_id: string;
  daily_rate: number | null;
  hourly_rate: number | null;
  preferred_id: string | null;
  hourly_category: 'flat' | 'corporate' | 'broadcast';
  
  // Joined data from crew_roles table
  role: {
    id: string;
    name: string;
    color: string;
  };
  
  // Joined data from crew_members table (preferred crew member)
  preferred_member?: {
    id: string;
    name: string;
    email?: string;
    avatar_url?: string;
  };
}

// Equipment groups for a specific variant
export interface VariantEquipmentGroup {
  id: string;
  project_id: string;
  variant_id: string;  // ✅ Fixed: Now uses variant_id instead of variant_name
  name: string;
  sort_order: number;
  total_price: number;
  equipment_items: VariantEquipmentItem[];
}

// Equipment items for a specific variant
export interface VariantEquipmentItem {
  id: string;
  project_id: string;
  variant_id: string;  // ✅ Fixed: Now uses variant_id instead of variant_name
  equipment_id: string;
  group_id: string | null;
  quantity: number;
  notes?: string;
  
  // Joined data from equipment table
  equipment: {
    id: string;
    name: string;
    rental_price: number | null;
    code?: string;
    stock?: number;
    folder_id?: string;
  };
}

// Sync operations for variants
export interface VariantSyncOptions {
  projectId: string;
  eventId: string;
  variantName: string;
  onProgress?: (progress: VariantSyncProgress) => void;
}

export interface VariantSyncProgress {
  step: 'crew' | 'equipment' | 'complete';
  progress: number; // 0-100
  message?: string;
}

export interface VariantSyncResult {
  success: boolean;
  conflicts: VariantSyncConflict[];
  synced_crew_roles: number;
  synced_equipment_items: number;
  errors?: string[];
}

export interface VariantSyncConflict {
  type: 'crew_assignment' | 'equipment_availability';
  resource_id: string;
  resource_name: string;
  conflict_reason: string;
  suggested_resolution?: string;
}

// Variant management operations
export interface VariantManagementHook {
  // Data
  variants: ProjectVariant[];
  selectedVariant: string;
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  setSelectedVariant: (variantName: string) => void;
  createVariant: (data: CreateVariantPayload) => Promise<ProjectVariant>;
  updateVariant: (data: UpdateVariantPayload) => Promise<ProjectVariant>;
  deleteVariant: (variantName: string) => Promise<void>;
  duplicateVariant: (sourceVariant: string, newVariantData: CreateVariantPayload) => Promise<ProjectVariant>;
  
  // Utilities
  getVariantByName: (variantName: string) => ProjectVariant | undefined;
  getDefaultVariant: () => ProjectVariant | undefined;
  reorderVariants: (variantIds: string[], newOrder: number[]) => Promise<void>;
}

// Optimized hook interfaces (replaced VariantResourcesHook with focused hooks)
// See: useVariantEquipment.ts, useVariantCrew.ts, useVariantData.ts

// Type guards for runtime type checking
export function isProjectVariant(obj: any): obj is ProjectVariant {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.project_id === 'string' &&
    typeof obj.variant_name === 'string' &&
    typeof obj.is_default === 'boolean';
}

export function isVariantCrewRole(obj: any): obj is VariantCrewRole {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.project_id === 'string' &&
    typeof obj.variant_id === 'string' &&  // ✅ Fixed: Now validates variant_id
    typeof obj.role_id === 'string' &&
    obj.role &&
    typeof obj.role.name === 'string';
}

export function isVariantEquipmentItem(obj: any): obj is VariantEquipmentItem {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.project_id === 'string' &&
    typeof obj.variant_id === 'string' &&  // ✅ Fixed: Now validates variant_id
    typeof obj.equipment_id === 'string' &&
    obj.equipment &&
    typeof obj.equipment.name === 'string';
}

// Constants for variant system
export const VARIANT_CONSTANTS = {
  DEFAULT_VARIANT_NAME: 'default',
  MAX_VARIANT_NAME_LENGTH: 50,
  MAX_VARIANTS_PER_PROJECT: 10,
  VALID_VARIANT_NAME_PATTERN: /^[a-zA-Z0-9\s\-_]+$/,
} as const;

// Utility functions
export function validateVariantName(name: string): boolean {
  const trimmedName = name.trim();
  return trimmedName.length > 0 && 
    trimmedName.length <= VARIANT_CONSTANTS.MAX_VARIANT_NAME_LENGTH &&
    VARIANT_CONSTANTS.VALID_VARIANT_NAME_PATTERN.test(trimmedName);
}

// No longer needed - variant_name is used directly for display