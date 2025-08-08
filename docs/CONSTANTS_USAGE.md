# 📋 **CONSTANTS USAGE GUIDE**
*How to use App Logic and Business Rules constants in Quincy*

---

## **�� OVERVIEW**

This guide shows how to properly use the constants defined in `src/constants/` throughout the Quincy codebase.

---

## **⚙️ APP LOGIC CONSTANTS** (Immutable)

### **Database Validation**
```typescript
import { validateVariantName, isValidEventStatus, DB_CONSTRAINTS } from '@/constants';

// Validate variant names
const isValid = validateVariantName("band_setup"); // true
const isInvalid = validateVariantName("Band Setup!"); // false

// Check event status
const status = "confirmed";
if (isValidEventStatus(status)) {
  // TypeScript knows status is EventStatus
  console.log(`Status ${status} is valid`);
}

// Use constraints in validation
const maxLength = DB_CONSTRAINTS.variant_name.max_length; // 50
```

### **System Invariants** 
```typescript
import { SYSTEM_INVARIANTS } from '@/constants';

// Runtime checks
const ensureSystemIntegrity = () => {
  if (!SYSTEM_INVARIANTS.variants.exactly_one_default) {
    throw new Error("System invariant violated: default variant required");
  }
};
```

### **Hook Patterns**
```typescript
import { HOOK_PATTERNS } from '@/constants';

// Follow naming conventions
const isValidHookName = (name: string) => {
  return name.startsWith(HOOK_PATTERNS.naming_convention.variant_scoped.replace('*', ''));
};
```

---

## **💼 BUSINESS RULES CONSTANTS** (Configurable)

### **Pricing Calculations**
```typescript
import { BUSINESS_RULES, CrewPricingSource } from '@/constants';

// Use current pricing source
const calculateCrewPrice = (event: CalendarEvent) => {
  const pricingSource = BUSINESS_RULES.pricing.crew_pricing_source;
  
  if (pricingSource === CrewPricingSource.VARIANT_RATES) {
    return calculateFromVariantRates(event);
  } else {
    return calculateFromEventAssignments(event);
  }
};

// Apply event type multipliers
const getEventMultiplier = (eventType: string) => {
  const multipliers = BUSINESS_RULES.pricing.event_type_multipliers;
  return multipliers[eventType] || { crew: 1.0, equipment: 1.0 };
};
```

### **Validation Rules**
```typescript
import { BUSINESS_RULES } from '@/constants';

// Rate validation
const validateDailyRate = (rate: number): boolean => {
  const { min_daily_rate, max_daily_rate } = BUSINESS_RULES.validation.rates;
  return rate >= min_daily_rate && rate <= max_daily_rate;
};

// Variant constraints
const canCreateVariant = (projectId: string, currentVariantCount: number): boolean => {
  const maxVariants = BUSINESS_RULES.validation.variants.max_variants_per_project;
  return currentVariantCount < maxVariants;
};
```

### **Invoice Status Logic**
```typescript
import { BUSINESS_RULES } from '@/constants';

// Check if invoice is overdue
const isInvoiceOverdue = (eventDate: Date): boolean => {
  const timeoutDays = BUSINESS_RULES.invoicing.invoice_ready_timeout_days;
  const daysSinceEvent = (Date.now() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceEvent > timeoutDays;
};
```

### **Sync Behavior**
```typescript
import { BUSINESS_RULES } from '@/constants';

// Check if auto-sync is enabled
const shouldAutoSync = (triggerType: 'variant_change' | 'event_create') => {
  const syncConfig = BUSINESS_RULES.sync;
  
  switch (triggerType) {
    case 'variant_change':
      return syncConfig.auto_sync_on_variant_change;
    case 'event_create':
      return syncConfig.auto_sync_on_event_create;
    default:
      return false;
  }
};
```

---

## **🎛️ ADMIN INTERFACE INTEGRATION**

### **Configuration Sections**
```typescript
import { ADMIN_CONFIG_SECTIONS } from '@/constants/businessRules';

// Render admin sections
const AdminInterface = () => {
  return (
    <div>
      {Object.entries(ADMIN_CONFIG_SECTIONS).map(([key, section]) => (
        <Section 
          key={key}
          title={section.title}
          icon={section.icon}
          description={section.description}
        >
          {section.settings.map(setting => (
            <SettingControl key={setting} setting={setting} />
          ))}
        </Section>
      ))}
    </div>
  );
};
```

### **Dynamic Configuration**
```typescript
import { BUSINESS_RULES, BusinessRulesConfig } from '@/constants';

// Override business rules at runtime (future feature)
const updateBusinessRule = async (path: string, value: any) => {
  // Save to database
  await supabase
    .from('business_config')
    .upsert({ key: path, value });
    
  // Update runtime config
  // This would require a config service/context
};

// Get current effective config (defaults + overrides)
const getEffectiveConfig = async (): Promise<BusinessRulesConfig> => {
  const overrides = await loadConfigOverrides();
  return mergeConfig(BUSINESS_RULES, overrides);
};
```

---

## **🔄 SYNC OPERATIONS**

### **Using Sync Patterns**
```typescript
import { SYNC_PATTERNS } from '@/constants';

// Follow immutable sync pattern
const syncEventResources = async (eventId: string, variantId: string) => {
  // Verify we're following the correct pattern
  const expectedStrategy = SYNC_PATTERNS.strategy; // 'DELETE_INSERT'
  
  if (expectedStrategy !== 'DELETE_INSERT') {
    throw new Error('Sync strategy mismatch');
  }
  
  // Execute operations in correct sequence
  for (const operation of SYNC_PATTERNS.operation_sequence) {
    await executeOperation(operation, eventId, variantId);
  }
};
```

### **RPC Function Calls**
```typescript
import { SYNC_PATTERNS } from '@/constants';

// Use correct RPC signatures
const syncCrew = async (eventId: string, projectId: string, variantId: string) => {
  const signature = SYNC_PATTERNS.rpc_functions.sync_event_crew.signature;
  
  // Call with correct parameters
  const { error } = await supabase.rpc('sync_event_crew', {
    p_event_id: eventId,
    p_project_id: projectId,
    p_variant_id: variantId
  });
  
  if (error) throw error;
};
```

---

## **🎯 BEST PRACTICES**

### **DO's**
```typescript
// ✅ Import from constants
import { BUSINESS_RULES } from '@/constants';

// ✅ Use constants for validation
const isValidRate = rate >= BUSINESS_RULES.validation.rates.min_daily_rate;

// ✅ Check invariants
if (!SYSTEM_INVARIANTS.variants.exactly_one_default) {
  throw new Error("Invariant violation");
}

// ✅ Follow patterns
const hookName = HOOK_PATTERNS.naming_convention.variant_scoped;
```

### **DON'Ts**
```typescript
// ❌ Don't hardcode values
const maxRate = 50000; // BAD

// ❌ Don't modify constants
BUSINESS_RULES.pricing.crew_pricing_source = "assignments"; // BAD

// ❌ Don't ignore invariants
// Skipping validation is dangerous

// ❌ Don't break patterns
const useVariantData = () => {}; // Should follow naming convention
```

---

## **📚 RELATED DOCUMENTATION**

- [App Logic](./APP_LOGIC.md) - Immutable technical foundation
- [Business Logic](./BUSINESS_LOGIC.md) - Configurable business rules
- [Database Schema](../supabase/migrations/) - Database structure
- [API Documentation](../src/integrations/supabase/) - API patterns

---

*Always reference constants instead of hardcoding values. This ensures consistency and makes the system configurable.*
