/**
 * ⚙️ APP LOGIC CONSTANTS
 * 
 * Immutable technical foundation constants for Quincy.
 * These values should NOT be changed without careful consideration.
 * 
 * @see docs/APP_LOGIC.md for detailed documentation
 */

// ============================================================================
// DATABASE CONSTRAINTS (IMMUTABLE)
// ============================================================================

export const DB_CONSTRAINTS = {
  // Variant naming rules (FIXED)
  variant_name: {
    pattern: /^[a-z0-9_]+$/,
    min_length: 1,
    max_length: 50
  },
  
  // Project constraints (FIXED)
  project: {
    number_sequence: 'project_number_seq',
    types: ['artist', 'corporate', 'broadcast', 'dry_hire'] as const
  },
  
  // Event constraints (FIXED)
  event: {
    statuses: ['proposed', 'confirmed', 'invoice ready', 'invoiced', 'cancelled'] as const
  },
  
  // Pricing constraints (FIXED)
  pricing: {
    min_value: 0,
    max_decimal_places: 2
  }
} as const;

// ============================================================================
// SYNC OPERATION PATTERNS (IMMUTABLE)
// ============================================================================

export const SYNC_PATTERNS = {
  // Core sync algorithm (NEVER CHANGE)
  strategy: 'DELETE_INSERT' as const,
  
  // Operation order (IMMUTABLE)
  operation_sequence: [
    'DELETE_EXISTING',
    'INSERT_FROM_VARIANT', 
    'CALCULATE_PRICING',
    'UPDATE_TOTALS',
    'TRIGGER_PGA_RECALC'
  ] as const,
  
  // RPC function signatures (IMMUTABLE)
  rpc_functions: {
    sync_event_crew: {
      signature: '(p_event_id uuid, p_project_id uuid, p_variant_id uuid)',
      return_type: 'void'
    },
    sync_event_equipment_unified: {
      signature: '(p_event_id uuid, p_project_id uuid, p_variant_id uuid)', 
      return_type: 'void'
    }
  }
} as const;

// ============================================================================
// FOREIGN KEY RELATIONSHIPS (IMMUTABLE)
// ============================================================================

export const FK_RELATIONSHIPS = {
  // Variant relationships (CASCADE DELETE)
  variant_dependencies: [
    'project_events.variant_id → project_variants.id',
    'project_roles.variant_id → project_variants.id',
    'project_equipment.variant_id → project_variants.id',
    'project_equipment_groups.variant_id → project_variants.id'
  ],
  
  // Event relationships (CASCADE DELETE)
  event_dependencies: [
    'project_event_roles.event_id → project_events.id',
    'project_event_equipment.event_id → project_events.id'
  ],
  
  // Project relationships
  project_dependencies: [
    'project_variants.project_id → projects.id',
    'project_events.project_id → projects.id'
  ]
} as const;

// ============================================================================
// SYSTEM INVARIANTS (NEVER VIOLATE)
// ============================================================================

export const SYSTEM_INVARIANTS = {
  // Variant requirements (ENFORCED BY DB)
  variants: {
    min_per_project: 1,
    exactly_one_default: true,
    unique_names_per_project: true
  },
  
  // Data integrity rules (ENFORCED BY CONSTRAINTS)
  integrity: {
    non_negative_prices: true,
    valid_variant_names: true,
    cascade_deletes: true,
    atomic_sync_operations: true
  },
  
  // Consistency guarantees (ENFORCED BY LOGIC)
  consistency: {
    eventual_pricing_consistency: true,
    sync_operations_atomic: true,
    realtime_updates: true
  }
} as const;

// ============================================================================
// HOOK ARCHITECTURE PATTERNS (IMMUTABLE)
// ============================================================================

export const HOOK_PATTERNS = {
  // Scope-based hook naming (IMMUTABLE CONVENTION)
  naming_convention: {
    variant_scoped: 'useVariant*',     // useVariantCrew, useVariantEquipment
    event_scoped: 'use*Event*',        // useUnifiedEventSync, useEventData  
    project_scoped: 'useProject*'      // useProjectVariants, useProjectEvents
  },
  
  // Data flow architecture (IMMUTABLE)
  data_flow: [
    'UI_COMPONENT',
    'HOOK_LAYER', 
    'SUPABASE_CLIENT',
    'DATABASE_FUNCTIONS',
    'REALTIME_UPDATES',
    'UI_RE_RENDER'
  ] as const,
  
  // Query patterns (IMMUTABLE)
  query_patterns: {
    variant_queries: 'WHERE variant_id = ?',
    event_queries: 'WHERE event_id = ?', 
    project_queries: 'WHERE project_id = ?'
  }
} as const;

// ============================================================================
// API RESPONSE PATTERNS (IMMUTABLE)
// ============================================================================

export const API_PATTERNS = {
  // Success responses (STANDARD FORMAT)
  success: {
    data_key: 'data',
    error_key: null,
    status_codes: [200, 201] as const
  },
  
  // Error responses (STANDARD FORMAT)  
  error: {
    data_key: null,
    error_key: 'error',
    status_codes: [400, 401, 403, 404, 500] as const,
    error_structure: {
      code: 'string',
      message: 'string', 
      details: 'string?',
      hint: 'string?'
    }
  },
  
  // RPC responses (SUPABASE STANDARD)
  rpc: {
    success: 'void | data',
    error: 'PostgrestError'
  }
} as const;

// ============================================================================
// PERFORMANCE CONSTRAINTS (BENCHMARKS)
// ============================================================================

export const PERFORMANCE_TARGETS = {
  // Sync operation timing (TARGET BENCHMARKS)
  sync_operations: {
    crew_sync_max_ms: 500,
    equipment_sync_max_ms: 1000,
    pricing_calculation_max_ms: 200,
    total_event_sync_max_ms: 2000
  },
  
  // Query performance (TARGET BENCHMARKS)
  queries: {
    variant_load_max_ms: 100,
    event_list_max_ms: 300,
    project_overview_max_ms: 500
  },
  
  // Real-time update latency (TARGET BENCHMARKS)
  realtime: {
    ui_update_max_ms: 50,
    subscription_latency_max_ms: 100
  }
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type DBConstraints = typeof DB_CONSTRAINTS;
export type SyncPatterns = typeof SYNC_PATTERNS;
export type FKRelationships = typeof FK_RELATIONSHIPS;
export type SystemInvariants = typeof SYSTEM_INVARIANTS;
export type HookPatterns = typeof HOOK_PATTERNS;
export type APIPatterns = typeof API_PATTERNS;
export type PerformanceTargets = typeof PERFORMANCE_TARGETS;

// Project types (from database enum)
export type ProjectType = typeof DB_CONSTRAINTS.project.types[number];

// Event statuses (from database enum)  
export type EventStatus = typeof DB_CONSTRAINTS.event.statuses[number];

// Sync operations (from sync pattern)
export type SyncOperation = typeof SYNC_PATTERNS.operation_sequence[number];

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export const validateVariantName = (name: string): boolean => {
  return DB_CONSTRAINTS.variant_name.pattern.test(name) &&
         name.length >= DB_CONSTRAINTS.variant_name.min_length &&
         name.length <= DB_CONSTRAINTS.variant_name.max_length;
};

export const isValidEventStatus = (status: string): status is EventStatus => {
  return DB_CONSTRAINTS.event.statuses.includes(status as EventStatus);
};

export const isValidProjectType = (type: string): type is ProjectType => {
  return DB_CONSTRAINTS.project.types.includes(type as ProjectType);
};

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

export const MIGRATION_PATTERNS = {
  // Safe migration practices (GUIDELINES)
  safe_changes: [
    'ADD_COLUMN_WITH_DEFAULT',
    'ADD_INDEX',
    'ADD_CONSTRAINT_NOT_VALIDATED',
    'ADD_NEW_ENUM_VALUE'
  ] as const,
  
  // Dangerous migrations (REQUIRE CAREFUL PLANNING)
  dangerous_changes: [
    'DROP_COLUMN',
    'DROP_TABLE', 
    'CHANGE_COLUMN_TYPE',
    'DROP_CONSTRAINT',
    'RENAME_COLUMN'
  ] as const,
  
  // Required migration order (IMMUTABLE)
  migration_sequence: [
    'SCHEMA_CHANGES',
    'DATA_MIGRATION', 
    'CONSTRAINT_VALIDATION',
    'INDEX_CREATION',
    'FUNCTION_UPDATES'
  ] as const
} as const;
