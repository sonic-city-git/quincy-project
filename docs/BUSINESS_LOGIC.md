# 💼 **QUINCY BUSINESS LOGIC**
*Configurable Rules & Settings*

---

## **📋 OVERVIEW**

This document defines the **configurable business rules** in Quincy. These settings can be adjusted through the admin interface to modify system behavior without code changes.

---

## **💰 PRICING CALCULATION RULES** ⚙️ **CONFIGURABLE**

### **Crew Pricing Source**
```typescript
// Current implementation
enum CrewPricingSource {
  VARIANT_RATES = "variant",     // Calculate from variant template rates
  EVENT_ASSIGNMENTS = "assignments" // Calculate from actual event assignments
}

// Default: VARIANT_RATES
// Admin setting: crew_pricing_source
```

**Business Rule:** *"As long as an event has a variant, it calculates the content of that variant"*

### **Rate Multipliers**
```typescript
// Event type multipliers (configurable per event type)
interface EventTypeMultipliers {
  crew_rate_multiplier: number;     // Default: 1.0
  equipment_price_multiplier: number; // Default: 1.0
}

// Example configurations:
const EVENT_TYPE_MULTIPLIERS = {
  show: { crew: 1.0, equipment: 1.0 },
  festival: { crew: 1.2, equipment: 1.1 },
  corporate: { crew: 1.5, equipment: 1.2 },
  broadcast: { crew: 2.0, equipment: 1.3 }
}
```

### **Project Type Pricing**
```typescript
// Project-level pricing adjustments
interface ProjectTypeConfig {
  base_crew_multiplier: number;
  base_equipment_multiplier: number;
  supports_variants: boolean;
  max_variants: number;
}

const PROJECT_TYPE_CONFIG = {
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
  }
}
```

---

## **📊 INVOICE STATUS RULES** ⚙️ **CONFIGURABLE**

### **Timeline Thresholds**
```typescript
interface InvoiceTimingConfig {
  invoice_ready_timeout_days: number;    // Default: 14
  overdue_warning_days: number;          // Default: 7
  auto_mark_invoiced: boolean;           // Default: false
  
  // Grace periods
  proposal_to_confirmed_days: number;    // Default: 30
  confirmed_to_invoice_ready_days: number; // Default: 7
}
```

### **Status Transition Rules**
```typescript
enum EventStatus {
  PROPOSED = "proposed",
  CONFIRMED = "confirmed", 
  INVOICE_READY = "invoice ready",
  INVOICED = "invoiced",
  CANCELLED = "cancelled"
}

interface StatusTransitionRules {
  allow_backwards_transitions: boolean;   // Default: true
  require_confirmation_before_invoice: boolean; // Default: true
  auto_invoice_ready_after_event: boolean; // Default: false
}
```

---

## **📈 PGA CALCULATION RULES** ⚙️ **CONFIGURABLE**

### **Inclusion/Exclusion Rules**
```typescript
interface PGACalculationConfig {
  exclude_cancelled_events: boolean;     // Default: true
  exclude_proposed_events: boolean;      // Default: false
  minimum_events_for_pga: number;        // Default: 1
  
  // Date range constraints
  pga_calculation_months_back: number;   // Default: 12 (all time if 0)
  include_future_confirmed_events: boolean; // Default: true
}
```

### **Currency & Display**
```typescript
interface CurrencyConfig {
  default_currency: string;              // Default: "NOK"
  currency_symbol: string;               // Default: "kr"
  decimal_places: number;                // Default: 0
  thousands_separator: string;           // Default: " "
}
```

---

## **🔄 SYNC BEHAVIOR RULES** ⚙️ **CONFIGURABLE**

### **Automatic Sync Triggers**
```typescript
interface SyncConfig {
  auto_sync_on_variant_change: boolean;     // Default: true
  auto_sync_on_event_create: boolean;       // Default: true
  auto_sync_on_crew_rate_change: boolean;   // Default: false
  auto_sync_on_equipment_change: boolean;   // Default: false
  
  // Conflict resolution
  preserve_manual_assignments: boolean;     // Default: false
  notify_on_sync_conflicts: boolean;        // Default: true
}
```

### **Assignment Override Rules**
```typescript
interface AssignmentOverrideConfig {
  allow_crew_override: boolean;             // Default: true
  allow_equipment_quantity_override: boolean; // Default: true
  require_approval_for_overrides: boolean;  // Default: false
  
  // Preferred crew handling
  always_use_preferred_crew: boolean;       // Default: true
  fallback_when_preferred_unavailable: boolean; // Default: true
}
```

---

## **✅ VALIDATION RULES** ⚙️ **CONFIGURABLE**

### **Rate Constraints**
```typescript
interface RateValidationConfig {
  min_daily_rate: number;                   // Default: 0
  max_daily_rate: number;                   // Default: 50000
  min_hourly_rate: number;                  // Default: 0
  max_hourly_rate: number;                  // Default: 2000
  
  // Rate relationship validation
  require_daily_rate: boolean;              // Default: true
  require_hourly_rate: boolean;             // Default: false
  validate_daily_hourly_relationship: boolean; // Default: false
}
```

### **Event Constraints**
```typescript
interface EventValidationConfig {
  require_future_dates: boolean;            // Default: false
  max_events_per_day: number;               // Default: 0 (unlimited)
  min_event_duration_hours: number;         // Default: 1
  max_event_duration_hours: number;         // Default: 24
  
  // Location validation
  require_city_location: boolean;           // Default: true
  validate_location_coordinates: boolean;   // Default: false
}
```

---

## **🏗️ VARIANT SYSTEM RULES** ⚙️ **CONFIGURABLE**

### **Variant Creation Rules**
```typescript
interface VariantConfig {
  max_variants_per_project: number;         // Default: 10
  require_default_variant: boolean;         // Default: true (FIXED)
  allow_variant_deletion: boolean;          // Default: true
  
  // Naming constraints
  min_variant_name_length: number;          // Default: 1
  max_variant_name_length: number;          // Default: 50
  allowed_variant_name_pattern: string;     // Default: "^[a-z0-9_]+$"
}
```

### **Resource Requirements**
```typescript
interface VariantResourceConfig {
  require_crew_roles: boolean;              // Default: false
  require_equipment: boolean;               // Default: false
  min_crew_roles_per_variant: number;       // Default: 0
  max_crew_roles_per_variant: number;       // Default: 20
}
```

---

## **🎛️ ADMIN INTERFACE MAPPING**

### **Configuration Categories**
```typescript
// How business rules map to admin UI sections
const ADMIN_CONFIG_SECTIONS = {
  pricing: {
    title: "Pricing & Rates",
    settings: [
      "crew_pricing_source",
      "event_type_multipliers", 
      "project_type_config",
      "currency_config"
    ]
  },
  
  invoicing: {
    title: "Invoice Management", 
    settings: [
      "invoice_timing_config",
      "status_transition_rules",
      "pga_calculation_config"
    ]
  },
  
  synchronization: {
    title: "Sync Behavior",
    settings: [
      "sync_config",
      "assignment_override_config"
    ]
  },
  
  validation: {
    title: "Business Rules",
    settings: [
      "rate_validation_config",
      "event_validation_config", 
      "variant_config"
    ]
  }
}
```

---

## **🎯 IMPLEMENTATION PLAN**

### **Phase 1: Constants File**
```typescript
// src/constants/businessRules.ts
export const BUSINESS_RULES = {
  pricing: { /* ... */ },
  invoicing: { /* ... */ },
  sync: { /* ... */ },
  validation: { /* ... */ }
}
```

### **Phase 2: Admin Interface**
```typescript
// src/pages/admin/BusinessRules.tsx
// UI for modifying business rules with validation
```

### **Phase 3: Database Storage**
```sql
-- business_config table for storing overrides
CREATE TABLE business_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

*These business rules can be modified through the admin interface to adapt system behavior without code deployments.*
