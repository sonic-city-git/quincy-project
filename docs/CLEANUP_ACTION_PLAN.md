# 🧹 **QUINCY CLEANUP ACTION PLAN**
*Systematic Approach to Resolving Critical Architecture Issues*

---

## **🎯 EXECUTIVE SUMMARY**

**Current State**: 🔴 **CRITICAL SYSTEM FAILURE**
- **8 Critical (P0) Issues** requiring immediate attention
- **12 High Priority (P1) Issues** blocking reliable development  
- **Technical Debt Score**: SEVERE
- **Code Quality Compliance**: 31%

**Cleanup Effort**: **~3-4 weeks** with systematic approach
**Risk Level**: **HIGH** - Production system integrity at risk

---

## **📋 CLEANUP PHASES OVERVIEW**

### **PHASE 1: CRITICAL STABILIZATION** (Week 1)
🚨 **MUST COMPLETE FIRST** - System integrity at risk
- Fix migration timestamp ordering
- Resolve RPC function signature chaos  
- Standardize variant_name vs variant_id usage
- Establish current database state

### **PHASE 2: ARCHITECTURE CONSOLIDATION** (Week 2)
⚡ **Core architecture fixes** 
- Consolidate business logic implementations
- Fix hook architecture violations
- Remove contradictory code paths
- Implement single source of truth patterns

### **PHASE 3: CODE QUALITY RESTORATION** (Week 3)
🔧 **Quality and consistency improvements**
- Remove unused/legacy code
- Standardize file organization
- Fix type safety violations  
- Implement consistent error handling

### **PHASE 4: BUSINESS RULES IMPLEMENTATION** (Week 4)
💼 **Make documented rules actually work**
- Create business rules service
- Replace hardcoded logic with configurable rules
- Implement missing business rule enforcement
- Create admin interface foundation

---

## **�� PHASE 1: CRITICAL STABILIZATION**

### **DAY 1-2: DATABASE STATE DISCOVERY**

#### **Action 1.1: Determine Current Database State**
```sql
-- Execute these queries to understand current state:

-- 1. Check which sync functions exist
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name LIKE 'sync_event_%'
ORDER BY routine_name;

-- 2. Check function parameters
SELECT routine_name, parameter_name, data_type, parameter_mode
FROM information_schema.parameters 
WHERE specific_name IN (
  SELECT specific_name FROM information_schema.routines 
  WHERE routine_name LIKE 'sync_event_%'
)
ORDER BY routine_name, ordinal_position;

-- 3. Check table schemas for is_synced column
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name IN ('project_event_roles', 'project_event_equipment')
  AND column_name = 'is_synced';

-- 4. Check variant relationship integrity
SELECT 
  COUNT(*) as total_events,
  COUNT(variant_id) as events_with_variant,
  COUNT(*) - COUNT(variant_id) as orphaned_events
FROM project_events;
```

**Deliverable**: `DATABASE_STATE_REPORT.md` with current schema state

#### **Action 1.2: Fix Migration Timestamp Chaos**
```bash
# Rename future-dated migrations to proper timestamps
mv supabase/migrations/20250109_fix_crew_price_calculation.sql \
   supabase/migrations/20240120_fix_crew_price_calculation.sql

mv supabase/migrations/20250109001_revert_crew_price_fix.sql \
   supabase/migrations/20240121_revert_crew_price_fix.sql

mv supabase/migrations/20250109002_fix_schema_sync_issues.sql \
   supabase/migrations/20240122_fix_schema_sync_issues.sql

mv supabase/migrations/20250119_fix_sync_functions_variant_id.sql \
   supabase/migrations/20240123_fix_sync_functions_variant_id.sql

mv supabase/migrations/20250807025100_update_sync_functions_use_variant_id.sql \
   supabase/migrations/20240124_update_sync_functions_use_variant_id.sql
```

**Deliverable**: Properly ordered migration files

### **DAY 3-4: RPC FUNCTION STANDARDIZATION**

#### **Action 1.3: Choose ONE Function Signature Pattern**
**Decision Required**: Choose between:
- **Option A**: `sync_event_crew(p_event_id, p_project_id, p_variant_id)` (UUID-based)
- **Option B**: `sync_event_crew(p_event_id, p_project_id, p_variant_name)` (text-based)

**Recommendation**: **Option A (UUID-based)** for data integrity

#### **Action 1.4: Create Single Source Function Definitions**
```sql
-- Create: 20240125_standardize_sync_functions.sql

-- Remove all existing sync function variations
DROP FUNCTION IF EXISTS sync_event_crew(uuid, uuid);
DROP FUNCTION IF EXISTS sync_event_crew(uuid, uuid, text);
DROP FUNCTION IF EXISTS sync_event_crew(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS sync_event_equipment(uuid, uuid);
DROP FUNCTION IF EXISTS sync_event_equipment(uuid, uuid, text);
DROP FUNCTION IF EXISTS sync_event_equipment_unified(uuid, uuid);
DROP FUNCTION IF EXISTS sync_event_equipment_unified(uuid, uuid, text);
DROP FUNCTION IF EXISTS sync_event_equipment_unified(uuid, uuid, uuid);

-- Create standardized functions with SINGLE signature each
CREATE OR REPLACE FUNCTION sync_event_crew(
  p_event_id uuid,
  p_project_id uuid,
  p_variant_id uuid
)
RETURNS void AS $$
-- Single, consistent implementation
$$;

CREATE OR REPLACE FUNCTION sync_event_equipment(
  p_event_id uuid,
  p_project_id uuid,
  p_variant_id uuid
)
RETURNS void AS $$
-- Single, consistent implementation  
$$;
```

**Deliverable**: Single source of truth for sync functions

#### **Action 1.5: Update Frontend to Match**
```typescript
// Update ALL files calling sync functions:

// ❌ Remove inconsistent calls:
// useUnifiedEventSync.ts line 70: 'sync_event_equipment'
// eventQueries.ts line 208: 'sync_event_equipment_unified'
// variantHelpers.ts line 54: p_variant_name

// ✅ Standardize to:
supabase.rpc('sync_event_crew', {
  p_event_id: eventId,
  p_project_id: projectId,
  p_variant_id: variantId  // Always UUID, never string
});

supabase.rpc('sync_event_equipment', {
  p_event_id: eventId,
  p_project_id: projectId,
  p_variant_id: variantId  // Always UUID, never string
});
```

**Files to Update**:
- `src/hooks/useUnifiedEventSync.ts` (lines 70, 99, 465, 475)
- `src/utils/eventQueries.ts` (line 208, 223)
- `src/utils/syncExistingCrewData.ts` (line 45)
- `src/utils/variantHelpers.ts` (line 54)

### **DAY 5-7: Variant Identification Standardization**

#### **Action 1.6: Choose variant_name vs variant_id Pattern**
**Decision Required**: Standardize parameter patterns
- **Frontend Hook Parameters**: `(projectId: string, variantId: string)` 
- **Database Queries**: Always use `variant_id` (UUID foreign keys)
- **User Interface**: Display `variant_name` but pass `variant_id`

#### **Action 1.7: Update Hook Signatures**
```typescript
// ❌ Current inconsistent patterns:
useVariantCrew(projectId: string, variantName: string)
useVariantEquipment(projectId: string, variantName: string)

// ✅ Standardized pattern:
useVariantCrew(projectId: string, variantId: string) 
useVariantEquipment(projectId: string, variantId: string)

// Update internal queries to match:
.eq('variant_id', variantId) // No more variant_name lookups
```

**Files to Update**:
- `src/hooks/useVariantCrew.ts`
- `src/hooks/useVariantEquipment.ts` 
- `src/hooks/useVariantData.ts`
- All components calling these hooks

#### **Action 1.8: Fix Cache Key Consistency**
```typescript
// ❌ Current inconsistent cache keys:
queryKey: ['variant-crew', projectId, variantName]
invalidate: ['project-roles', projectId]

// ✅ Consistent cache keys:
queryKey: ['variant-crew', projectId, variantId]
invalidate: ['variant-crew', projectId, variantId]
```

**Deliverable**: Consistent variant identification throughout system

---

## **⚡ PHASE 2: ARCHITECTURE CONSOLIDATION**

### **DAY 8-10: Business Logic Consolidation**

#### **Action 2.1: Choose ONE Pricing Algorithm**
Based on user statement: *"as long as an event has a variant, it calculates the content of that variant"*

**Decision**: Use **variant-based pricing** (Algorithm A)
```sql
-- SINGLE crew pricing implementation:
crew_price = COALESCE((
  SELECT SUM(COALESCE(pr.daily_rate, 0) * v_crew_rate_multiplier)
  FROM project_roles pr 
  WHERE pr.variant_id = v_actual_variant_id
), 0)
```

#### **Action 2.2: Remove Contradictory Implementations**
```sql
-- Create: 20240126_consolidate_pricing_logic.sql

-- Update sync_event_crew to use ONLY variant-based pricing
-- Remove all event-based pricing calculations
-- Ensure consistent business logic across all functions
```

#### **Action 2.3: Create Business Rules Service**
```typescript
// Create: src/services/BusinessRulesService.ts
export class BusinessRulesService {
  static getPricingSource(): CrewPricingSource {
    return BUSINESS_RULES.pricing.crew_pricing_source;
  }
  
  static getEventMultiplier(eventType: string) {
    return BUSINESS_RULES.pricing.event_type_multipliers[eventType] || 
           { crew: 1.0, equipment: 1.0 };
  }
  
  static shouldAutoSync(triggerType: string): boolean {
    const config = BUSINESS_RULES.sync;
    switch (triggerType) {
      case 'variant_change': return config.auto_sync_on_variant_change;
      case 'event_create': return config.auto_sync_on_event_create;
      default: return false;
    }
  }
  
  // ... implement all business rule getters
}
```

### **DAY 11-14: Hook Architecture Fixes**

#### **Action 2.4: Split Overcomplicated Hooks**
```typescript
// ❌ Current: useVariantEquipment (752 lines, 4 concerns)
// ✅ Split into:

// useVariantEquipment.ts (equipment operations only)
export function useVariantEquipment(projectId: string, variantId: string) {
  // Only equipment CRUD operations
  // ~200 lines maximum
}

// useEquipmentGroups.ts (group operations only)  
export function useEquipmentGroups(projectId: string, variantId: string) {
  // Only group CRUD operations
  // ~150 lines maximum
}

// useGroupManagement.ts (UI state only)
export function useGroupManagement() {
  // Only UI state management
  // ~100 lines maximum
}
```

#### **Action 2.5: Standardize Hook Return Patterns**
```typescript
// ✅ Consistent return object structure:
interface HookReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  // Mutations as functions, not objects
  create: (data: CreateData) => Promise<T>;
  update: (id: string, data: UpdateData) => Promise<T>;
  remove: (id: string) => Promise<void>;
}

// Apply to all hooks for consistency
```

#### **Action 2.6: Fix Cache Invalidation Strategy**
```typescript
// ✅ Systematic cache invalidation:
const invalidateRelatedCaches = (projectId: string, variantId: string) => {
  return Promise.all([
    queryClient.invalidateQueries(['variant-crew', projectId, variantId]),
    queryClient.invalidateQueries(['variant-equipment', projectId, variantId]),
    queryClient.invalidateQueries(['project-events', projectId]),
    queryClient.invalidateQueries(['project-pga', projectId])
  ]);
};
```

---

## **🔧 PHASE 3: CODE QUALITY RESTORATION**

### **DAY 15-17: Remove Legacy Code**

#### **Action 3.1: Identify and Remove Unused Code**
```bash
# Files identified for removal:
rm src/hooks/useProjectRoles.ts                    # Unused, variant-unaware
rm src/components/projectdetail/resources/crew/components/CrewRoleList.tsx  # Unused
rm src/hooks/useConsolidatedSyncStatus.ts         # Replaced by useUnifiedEventSync  
rm src/hooks/useEquipmentSync.ts                  # Replaced by useUnifiedEventSync
rm src/hooks/useSyncCrewStatus.ts                 # Replaced by useUnifiedEventSync
rm src/hooks/useSyncStatus.ts                     # Replaced by useUnifiedEventSync
rm src/hooks/useSyncSubscriptions.ts              # Replaced by useUnifiedEventSync
rm src/hooks/useVariantSync.ts                    # Replaced by useUnifiedEventSync
rm src/components/shared/forms/VariantSelector.tsx # Replaced by SimpleVariantSelector
```

#### **Action 3.2: Fix Type Safety Violations**
```typescript
// Fix: src/types/variants.ts
export function isProjectVariant(obj: any): obj is ProjectVariant {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.project_id === 'string' &&
    typeof obj.variant_name === 'string' &&
    typeof obj.is_default === 'boolean' &&  // ✅ Required, not optional
    typeof obj.sort_order === 'number';
}

// Fix: All type guards to match actual schema
// Add strict TypeScript compiler options
```

### **DAY 18-21: File Organization**

#### **Action 3.3: Reorganize Hook Structure**
```bash
# Reorganize hooks by domain:
mkdir -p src/hooks/{project,variant,event,crew,equipment,customer,ui,shared}

# Move files to appropriate domains:
mv src/hooks/useProjectVariants.ts src/hooks/project/
mv src/hooks/useVariantCrew.ts src/hooks/variant/
mv src/hooks/useUnifiedEventSync.ts src/hooks/event/
# ... etc
```

#### **Action 3.4: Standardize Import Patterns**
```typescript
// ✅ Consistent import style throughout:
import { supabase } from '@/integrations/supabase/client';
import { BUSINESS_RULES } from '@/constants';
import { BusinessRulesService } from '@/services/BusinessRulesService';

// ❌ Remove relative imports:
// import something from '../../../utils/helper';
```

#### **Action 3.5: Implement Consistent Error Handling**
```typescript
// Create: src/utils/errorHandling.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleHookError = (error: unknown, context: string): AppError => {
  if (error instanceof AppError) return error;
  if (error instanceof Error) {
    return new AppError(`${context}: ${error.message}`, 'HOOK_ERROR', error);
  }
  return new AppError(`${context}: Unknown error`, 'UNKNOWN_ERROR');
};

// Apply to all hooks for consistent error handling
```

---

## **💼 PHASE 4: BUSINESS RULES IMPLEMENTATION**

### **DAY 22-24: Business Rules Service**

#### **Action 4.1: Replace All Hardcoded Logic**
```typescript
// ❌ Replace hardcoded values:
const timeout = 14; // days
const excludeCancelled = true;
const multiplier = 1.5;

// ✅ With business rules service:
const timeout = BusinessRulesService.getInvoiceTimeout();
const shouldExclude = BusinessRulesService.shouldExcludeFromPGA(event);
const multiplier = BusinessRulesService.getEventMultiplier(eventType);
```

**Files to Update** (search and replace hardcoded logic):
- `src/hooks/useProjectPGA.ts`
- `src/hooks/useUnifiedEventSync.ts`
- All pricing calculation code
- All validation logic

#### **Action 4.2: Implement Missing Business Rules**
```typescript
// Add complete PGA calculation:
const calculatePGA = (events: CalendarEvent[]) => {
  const rules = BUSINESS_RULES.pga;
  
  // Apply ALL documented business rules:
  let filteredEvents = events.filter(event => 
    !BusinessRulesService.shouldExcludeFromPGA(event)
  );
  
  // Date range filtering
  if (rules.pga_calculation_months_back > 0) {
    filteredEvents = BusinessRulesService.filterByDateRange(filteredEvents, rules.pga_calculation_months_back);
  }
  
  // Minimum events validation
  if (filteredEvents.length < rules.minimum_events_for_pga) {
    return null;
  }
  
  // Future events handling
  if (rules.include_future_confirmed_events) {
    filteredEvents = [...filteredEvents, ...BusinessRulesService.getFutureConfirmedEvents(events)];
  }
  
  return BusinessRulesService.calculateAverage(filteredEvents);
};
```

### **DAY 25-28: Admin Interface Foundation**

#### **Action 4.3: Create Business Rules Admin Interface**
```typescript
// Create: src/pages/admin/BusinessRules.tsx
export function BusinessRulesAdmin() {
  return (
    <div className="space-y-6">
      {Object.entries(ADMIN_CONFIG_SECTIONS).map(([key, section]) => (
        <BusinessRuleSection 
          key={key}
          title={section.title}
          icon={section.icon}
          description={section.description}
          settings={section.settings}
        />
      ))}
    </div>
  );
}

// Create: src/components/admin/BusinessRuleSection.tsx
// Individual rule editing components
```

#### **Action 4.4: Database-Backed Configuration**
```sql
-- Create: 20240127_create_business_config.sql
CREATE TABLE business_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add RLS policies for admin access only
```

```typescript
// Create: src/services/BusinessConfigService.ts
export class BusinessConfigService {
  static async getConfig<T>(key: string, defaultValue: T): Promise<T> {
    const { data } = await supabase
      .from('business_config')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    
    return data?.value ?? defaultValue;
  }
  
  static async setConfig(key: string, value: any): Promise<void> {
    await supabase
      .from('business_config')
      .upsert({ key, value });
  }
}
```

---

## **🧪 TESTING AND VALIDATION**

### **Testing Strategy Per Phase**

#### **Phase 1 Testing**
```typescript
// Test database state
describe('Migration State', () => {
  test('all sync functions exist with correct signatures', async () => {
    const functions = await queryDatabaseFunctions();
    expect(functions).toContain('sync_event_crew(uuid, uuid, uuid)');
    expect(functions).toContain('sync_event_equipment(uuid, uuid, uuid)');
  });
  
  test('no orphaned variant relationships', async () => {
    const orphanedEvents = await findOrphanedEvents();
    expect(orphanedEvents).toHaveLength(0);
  });
});
```

#### **Phase 2 Testing**
```typescript
// Test business logic consistency
describe('Pricing Calculations', () => {
  test('variant-based pricing always used', async () => {
    const result = await calculateCrewPrice(testVariant, testEvent);
    expect(result.source).toBe('variant');
    expect(result.algorithm).toBe('variant_rates');
  });
  
  test('no contradictory pricing algorithms', () => {
    const implementations = findPricingImplementations();
    expect(implementations).toHaveLength(1);
  });
});
```

#### **Phase 3 Testing**
```typescript
// Test code quality
describe('Hook Architecture', () => {
  test('all hooks follow naming conventions', () => {
    const hooks = getAllHooks();
    hooks.forEach(hook => {
      expect(hook.name).toMatch(HOOK_PATTERNS.naming_convention);
    });
  });
  
  test('cache keys match query keys', () => {
    const hooks = getAllHooksWithCache();
    hooks.forEach(hook => {
      expect(hook.queryKey).toEqual(hook.invalidationKey);
    });
  });
});
```

#### **Phase 4 Testing**
```typescript
// Test business rules implementation
describe('Business Rules Service', () => {
  test('all documented rules have implementations', () => {
    const documentedRules = Object.keys(BUSINESS_RULES);
    const implementedRules = BusinessRulesService.getImplementedRules();
    expect(implementedRules).toEqual(documentedRules);
  });
  
  test('no hardcoded business logic remains', () => {
    const hardcodedValues = findHardcodedBusinessLogic();
    expect(hardcodedValues).toHaveLength(0);
  });
});
```

---

## **📊 SUCCESS METRICS**

### **Phase 1 Success Criteria** 
- ✅ All sync function calls succeed without errors
- ✅ Migration system returns to chronological order
- ✅ Variant identification consistent throughout system
- ✅ No orphaned database records

### **Phase 2 Success Criteria**
- ✅ Single pricing algorithm implementation 
- ✅ Hook pattern compliance > 90%
- ✅ Cache invalidation consistency > 95%
- ✅ Business rules service operational

### **Phase 3 Success Criteria**
- ✅ Code quality compliance > 85%
- ✅ File organization follows documented patterns
- ✅ Type safety violations eliminated
- ✅ Error handling consistency > 90%

### **Phase 4 Success Criteria**
- ✅ Business rules implementation > 90%
- ✅ Hardcoded logic eliminated
- ✅ Admin interface functional
- ✅ Database-backed configuration working

---

## **⚠️ RISKS AND MITIGATION**

### **HIGH RISK FACTORS**
- **Production Data Integrity**: Schema changes could corrupt data
- **Function Downtime**: RPC signature changes need coordinated deployment
- **User Experience**: Cleanup might temporarily break features

### **MITIGATION STRATEGIES**
1. **Complete Backup**: Full database backup before any changes
2. **Staging Environment**: Test all changes with production data copy
3. **Gradual Rollout**: Deploy in phases with rollback plans
4. **Feature Flags**: Hide functionality during cleanup if needed
5. **Communication Plan**: Inform stakeholders of cleanup timeline

### **ROLLBACK PLANS**
- **Phase 1**: Can rollback migrations if issues detected
- **Phase 2**: Keep old implementations until new ones proven stable
- **Phase 3**: File organization changes are low risk
- **Phase 4**: Business rules changes can be quickly reverted

---

## **🎯 FINAL DELIVERABLES**

### **Documentation**
- ✅ `DATABASE_STATE_REPORT.md` - Current schema and function state
- ✅ `MIGRATION_CLEANUP_REPORT.md` - Migration fixes applied
- ✅ `BUSINESS_RULES_IMPLEMENTATION.md` - Rules enforcement status
- ✅ `HOOK_ARCHITECTURE_COMPLIANCE.md` - Pattern compliance report

### **Code Changes**
- ✅ Cleaned migration files with proper timestamps
- ✅ Standardized RPC function signatures
- ✅ Consistent hook architecture patterns
- ✅ Business rules service implementation
- ✅ Admin interface foundation

### **Testing Suite**
- ✅ Migration state validation tests
- ✅ Business logic consistency tests  
- ✅ Hook architecture compliance tests
- ✅ Integration test coverage > 80%

---

*This cleanup plan transforms the Quincy codebase from critical technical debt to a maintainable, reliable system ready for continued feature development.*
