/**
 * 💼 BUSINESS RULES CONSTANTS
 * 
 * Configurable business logic for Quincy.
 * These values can be modified through admin interface.
 * 
 * @see docs/BUSINESS_LOGIC.md for detailed documentation
 */

// ============================================================================
// PRICING CALCULATION RULES
// ============================================================================

export enum CrewPricingSource {
  VARIANT_RATES = "variant",      // Calculate from variant template rates
  EVENT_ASSIGNMENTS = "assignments" // Calculate from actual event assignments
}

export const DEFAULT_PRICING_CONFIG = {
  crew_pricing_source: CrewPricingSource.VARIANT_RATES,
  
  // Event type multipliers (configurable per event type)
  event_type_multipliers: {
    show: { crew: 1.0, equipment: 1.0 },
    festival: { crew: 1.2, equipment: 1.1 },
    corporate: { crew: 1.5, equipment: 1.2 },
    broadcast: { crew: 2.0, equipment: 1.3 }
  },
  
  // Project type configurations
  project_type_config: {
    artist: { 
      base_crew_multiplier: 1.0,
      base_equipment_multiplier: 1.0,
      supports_variants: true,
      max_variants: 10 
    },
    corporate: {
      base_crew_multiplier: 1.2,
      base_equipment_multiplier: 1.1, 
      supports_variants: false,
      max_variants: 1
    },
    broadcast: {
      base_crew_multiplier: 1.5,
      base_equipment_multiplier: 1.3,
      supports_variants: true,
      max_variants: 5
    },
    dry_hire: {
      base_crew_multiplier: 0.8,
      base_equipment_multiplier: 1.0,
      supports_variants: false,
      max_variants: 1
    }
  }
} as const;

// ============================================================================
// INVOICE STATUS RULES
// ============================================================================

export const DEFAULT_INVOICE_CONFIG = {
  // Timeline thresholds
  invoice_ready_timeout_days: 14,
  overdue_warning_days: 7,
  auto_mark_invoiced: false,
  
  // Grace periods
  proposal_to_confirmed_days: 30,
  confirmed_to_invoice_ready_days: 7,
  
  // Status transition rules
  allow_backwards_transitions: true,
  require_confirmation_before_invoice: true,
  auto_invoice_ready_after_event: false
} as const;

// ============================================================================
// PGA CALCULATION RULES
// ============================================================================

export const DEFAULT_PGA_CONFIG = {
  exclude_cancelled_events: true,
  exclude_proposed_events: false,
  minimum_events_for_pga: 1,
  
  // Date range constraints
  pga_calculation_months_back: 12, // 0 = all time
  include_future_confirmed_events: true,
  
  // Currency settings
  currency: {
    default_currency: "NOK",
    currency_symbol: "kr",
    decimal_places: 0,
    thousands_separator: " "
  }
} as const;

// ============================================================================
// SYNC BEHAVIOR RULES
// ============================================================================

export const DEFAULT_SYNC_CONFIG = {
  // Automatic sync triggers
  auto_sync_on_variant_change: true,
  auto_sync_on_event_create: true,
  auto_sync_on_crew_rate_change: false,
  auto_sync_on_equipment_change: false,
  
  // Conflict resolution
  preserve_manual_assignments: false,
  notify_on_sync_conflicts: true,
  
  // Assignment override rules
  allow_crew_override: true,
  allow_equipment_quantity_override: true,
  require_approval_for_overrides: false,
  
  // Preferred crew handling
  always_use_preferred_crew: true,
  fallback_when_preferred_unavailable: true
} as const;

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const DEFAULT_VALIDATION_CONFIG = {
  // Rate constraints
  rates: {
    min_daily_rate: 0,
    max_daily_rate: 50000,
    min_hourly_rate: 0,
    max_hourly_rate: 2000,
    
    // Rate relationship validation
    require_daily_rate: true,
    require_hourly_rate: false,
    validate_daily_hourly_relationship: false
  },
  
  // Event constraints
  events: {
    require_future_dates: false,
    max_events_per_day: 0, // 0 = unlimited
    min_event_duration_hours: 1,
    max_event_duration_hours: 24,
    
    // Location validation
    require_city_location: true,
    validate_location_coordinates: false
  },
  
  // Variant constraints
  variants: {
    max_variants_per_project: 10,
    require_default_variant: true, // FIXED - cannot be changed
    allow_variant_deletion: true,
    
    // Naming constraints
    min_variant_name_length: 1,
    max_variant_name_length: 50,
    allowed_variant_name_pattern: "^[a-z0-9_]+$",
    
    // Resource requirements
    require_crew_roles: false,
    require_equipment: false,
    min_crew_roles_per_variant: 0,
    max_crew_roles_per_variant: 20
  }
} as const;

// ============================================================================
// COMBINED BUSINESS RULES
// ============================================================================

export const BUSINESS_RULES = {
  pricing: DEFAULT_PRICING_CONFIG,
  invoicing: DEFAULT_INVOICE_CONFIG,
  pga: DEFAULT_PGA_CONFIG,
  sync: DEFAULT_SYNC_CONFIG,
  validation: DEFAULT_VALIDATION_CONFIG
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type BusinessRulesConfig = typeof BUSINESS_RULES;
export type PricingConfig = typeof DEFAULT_PRICING_CONFIG;
export type InvoiceConfig = typeof DEFAULT_INVOICE_CONFIG;
export type PGAConfig = typeof DEFAULT_PGA_CONFIG;
export type SyncConfig = typeof DEFAULT_SYNC_CONFIG;
export type ValidationConfig = typeof DEFAULT_VALIDATION_CONFIG;

// ============================================================================
// ADMIN INTERFACE CONFIGURATION
// ============================================================================

export const ADMIN_CONFIG_SECTIONS = {
  pricing: {
    title: "Pricing & Rates",
    description: "Configure how crew and equipment pricing is calculated",
    icon: "💰",
    settings: [
      "crew_pricing_source",
      "event_type_multipliers", 
      "project_type_config"
    ]
  },
  
  invoicing: {
    title: "Invoice Management",
    description: "Set up invoice timing and status transition rules", 
    icon: "📄",
    settings: [
      "invoice_ready_timeout_days",
      "status_transition_rules",
      "currency_settings"
    ]
  },
  
  analytics: {
    title: "Analytics & PGA",
    description: "Configure Per Gig Average calculations and project analytics",
    icon: "📊", 
    settings: [
      "pga_calculation_rules",
      "event_inclusion_rules",
      "date_range_settings"
    ]
  },
  
  synchronization: {
    title: "Sync Behavior",
    description: "Control automatic synchronization between variants and events",
    icon: "🔄",
    settings: [
      "auto_sync_triggers",
      "conflict_resolution",
      "assignment_overrides"
    ]
  },
  
  validation: {
    title: "Business Rules",
    description: "Set validation constraints and business logic rules",
    icon: "✅",
    settings: [
      "rate_constraints",
      "event_validation",
      "variant_rules"
    ]
  }
} as const;
