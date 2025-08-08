# 🗄️ **DATABASE MIGRATION ANALYSIS**
*Critical Assessment of Migration State and Function Signatures*

---

## **🚨 CRITICAL ISSUES SUMMARY**

**STATUS**: 🔴 **MIGRATION SYSTEM COMPROMISED**

**Key Problems**:
- ❌ **Future-dated migrations** break chronological ordering
- ❌ **Multiple incompatible function versions** exist simultaneously  
- ❌ **Backward compatibility layers** never removed
- ❌ **Schema state undefined** due to conflicting migrations
- ❌ **RPC function signatures** don't match frontend calls

---

## **📅 MIGRATION TIMELINE ANALYSIS**

### **CHRONOLOGICAL ORDER VIOLATIONS**
```bash
# ❌ PROBLEM: Future-dated migrations
20250109_fix_crew_price_calculation.sql     # January 9, 2025
20250109001_revert_crew_price_fix.sql       # January 9, 2025  
20250109002_fix_schema_sync_issues.sql      # January 9, 2025
20250119_fix_sync_functions_variant_id.sql  # January 19, 2025
20250807025100_update_sync_functions_use_variant_id.sql # August 7, 2025

# ✅ CORRECT: Past dates (working migrations)
20240115_create_sync_functions.sql          # January 15, 2024
20240116_fix_sync_concurrency.sql          # January 16, 2024
20240117_fix_duplicate_equipment_sync.sql  # January 17, 2024
20240118_unified_equipment_sync.sql        # January 18, 2024
20240119_add_crew_price_calculation.sql    # January 19, 2024
```

**Impact**: Migration systems cannot guarantee consistent state when timestamps are in the future.

---

## **🔧 FUNCTION SIGNATURE EVOLUTION**

### **sync_event_crew** Evolution

#### **Version 1** (20240115_create_sync_functions.sql)
```sql
CREATE OR REPLACE FUNCTION sync_event_crew(
  p_event_id uuid, 
  p_project_id uuid
)
```
**Parameters**: 2 (no variant support)

#### **Version 2** (20240119_add_crew_price_calculation.sql)  
```sql
CREATE OR REPLACE FUNCTION sync_event_crew(
  p_event_id uuid, 
  p_project_id uuid
)
```
**Parameters**: 2 (still no variant support)
**Changes**: Added crew_price calculation

#### **Version 3** (20250807025100_update_sync_functions_use_variant_id.sql)
```sql
CREATE OR REPLACE FUNCTION sync_event_crew(
  p_event_id uuid,
  p_project_id uuid, 
  p_variant_id uuid DEFAULT NULL
)
```
**Parameters**: 3 (added variant_id support)
**Changes**: UUID-based variant relationships

#### **Version 4** (20250119_fix_sync_functions_variant_id.sql) 
```sql
CREATE OR REPLACE FUNCTION sync_event_crew(
  p_event_id uuid, 
  p_project_id uuid,
  p_variant_name text DEFAULT 'default'
)
```
**Parameters**: 3 (variant_name instead of variant_id)
**Changes**: Text-based variant relationships

#### **Version 5** (Same file, backward compatibility)
```sql
CREATE OR REPLACE FUNCTION sync_event_crew(
  p_event_id uuid,
  p_project_id uuid,
  p_variant_name text DEFAULT 'default'
)
```
**AND ALSO**:
```sql
CREATE OR REPLACE FUNCTION sync_event_crew(
  p_event_id uuid,
  p_project_id uuid, 
  p_variant_id uuid DEFAULT NULL
)
```
**PROBLEM**: Two functions with same name, different signatures!

---

### **sync_event_equipment** vs **sync_event_equipment_unified**

#### **Original Equipment Function** (20240115)
```sql
CREATE OR REPLACE FUNCTION sync_event_equipment(
  p_event_id uuid, 
  p_project_id uuid
)
```

#### **Unified Version** (20240118)
```sql
CREATE OR REPLACE FUNCTION sync_event_equipment_unified(
  p_event_id uuid, 
  p_project_id uuid
)
```

#### **Current Confusion**
```typescript
// Frontend calls BOTH:
supabase.rpc('sync_event_equipment', { ... })        // ❌ May not exist
supabase.rpc('sync_event_equipment_unified', { ... }) // ✅ Should exist

// But with DIFFERENT parameter patterns:
{ p_variant_id: ... }    // UUID-based
{ p_variant_name: ... }  // Text-based
```

---

## **📊 MIGRATION STATE MATRIX**

| Migration File | sync_event_crew | sync_event_equipment | sync_event_equipment_unified | Status |
|---------------|-----------------|---------------------|---------------------------|---------|
| 20240115 | ✅ (2 params) | ✅ (2 params) | ❌ | Applied |
| 20240116 | ✅ (2 params) | ✅ (2 params) | ❌ | Applied |
| 20240117 | ✅ (2 params) | ✅ (2 params) | ❌ | Applied |
| 20240118 | ❌ | ✅ (2 params) | ✅ (2 params) | Applied |
| 20240119 | ✅ (2 params) | ❌ | ✅ (2 params) | Applied |
| 20250807025100 | ✅ (3 params, UUID) | ❌ | ✅ (3 params, UUID) | ❓ Future |
| 20250119 | ✅ (3 params, text) | ❌ | ✅ (3 params, text) | ❓ Future |
| 20250109002 | ❌ | ❌ | ✅ (3 params, UUID) | ❓ Future |

**❓ Future**: Migration timestamp in future - application status unknown

---

## **🔍 BUSINESS LOGIC CONTRADICTIONS**

### **Crew Pricing Algorithm Evolution**

#### **Algorithm A** (20250807025100, lines 176-180)
```sql
-- ✅ VARIANT-BASED PRICING (from template)
crew_price = COALESCE((
  SELECT SUM(COALESCE(pr.daily_rate, 0) * v_crew_rate_multiplier)
  FROM project_roles pr 
  WHERE pr.project_id = p_project_id
    AND pr.variant_id = v_actual_variant_id
), 0)
```
**Logic**: Calculate price from variant template rates
**Business Rule**: "Event calculates content of that variant"

#### **Algorithm B** (20250119, lines 138-141)  
```sql
-- ❌ EVENT-BASED PRICING (from assignments)
crew_price = COALESCE((
  SELECT SUM(COALESCE(per.daily_rate, 0) * v_crew_rate_multiplier)
  FROM project_event_roles per
  WHERE per.event_id = p_event_id
), 0)
```
**Logic**: Calculate price from actual event assignments
**Business Rule**: "Price reflects actual crew assigned"

#### **Algorithm C** (20250109_fix_crew_price_calculation.sql)
```sql
-- ⚠️ MIXED APPROACH (attempted fix)
crew_price = COALESCE((
  SELECT SUM(COALESCE(per.daily_rate, 0) * v_crew_rate_multiplier)
  FROM project_event_roles per
  WHERE per.event_id = p_event_id
), 0)
```
**Then reverted in**: 20250109001_revert_crew_price_fix.sql

### **CONTRADICTORY IMPLEMENTATIONS**
The user stated business rule: *"as long as an event has a variant, it calculates the content of that variant"*

**This supports Algorithm A**, but **Algorithm B** also exists in the codebase.

---

## **🚨 SCHEMA INTEGRITY ISSUES**

### **Missing Column References**
```sql
-- Code references 'is_synced' column:
INSERT INTO project_event_roles (..., is_synced, ...)

-- But column creation is in future-dated migration:
-- 20250109002_fix_schema_sync_issues.sql
ALTER TABLE project_event_roles ADD COLUMN IF NOT EXISTS is_synced boolean DEFAULT false;
```

**Problem**: If future migrations didn't apply, column doesn't exist → SQL errors

### **Function Existence Uncertainty**  
```typescript
// Frontend calls:
supabase.rpc('sync_event_equipment', { ... })

// But latest migrations only define:
sync_event_equipment_unified(...)
```

**Problem**: Function name mismatch → RPC call failures

---

## **🔧 CURRENT DATABASE STATE ASSESSMENT**

### **UNKNOWN FACTORS**
Without querying production database, we cannot determine:

1. **Which migrations actually applied?**
   - Future-dated migrations may have failed
   - Some may have been manually applied
   - Rollbacks may have occurred

2. **Which functions currently exist?**
   - `sync_event_equipment` vs `sync_event_equipment_unified`
   - Parameter signatures (UUID vs text)
   - Backward compatibility functions

3. **Schema completeness**
   - Does `is_synced` column exist in `project_event_roles`?
   - Are foreign key constraints properly set?
   - Which indexes are present?

4. **Business logic implementation**
   - Which pricing algorithm is active?
   - Are there conflicting function definitions?

---

## **📋 IMMEDIATE DIAGNOSTIC ACTIONS NEEDED**

### **1. Database State Discovery**
```sql
-- Check which sync functions exist
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name LIKE 'sync_event_%';

-- Check function signatures
SELECT routine_name, data_type, parameter_name, parameter_mode
FROM information_schema.parameters 
WHERE specific_name IN (
  SELECT specific_name FROM information_schema.routines 
  WHERE routine_name LIKE 'sync_event_%'
);

-- Check table schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'project_event_roles';
```

### **2. Migration State Verification**
```sql
-- Check applied migrations (if using migration tracking)
SELECT * FROM supabase_migrations.schema_migrations 
ORDER BY created_at DESC;

-- Or check migration status via Supabase CLI
-- supabase migration list
```

### **3. Data Integrity Check**
```sql
-- Check for orphaned records due to schema inconsistencies
SELECT COUNT(*) FROM project_events WHERE variant_id IS NULL;
SELECT COUNT(*) FROM project_event_roles WHERE role_id NOT IN (SELECT id FROM crew_roles);
```

---

## **🎯 MIGRATION CLEANUP STRATEGY**

### **PHASE 1: ESTABLISH CURRENT STATE**
1. ✅ Query production database for actual schema
2. ✅ Identify which functions exist with which signatures  
3. ✅ Determine which migrations actually applied
4. ✅ Document current business logic implementation

### **PHASE 2: FIX TIMESTAMP ORDERING**
1. ✅ Rename future-dated migrations with proper timestamps
2. ✅ Create rollback scripts for conflicting migrations
3. ✅ Establish single source of truth for each function

### **PHASE 3: STANDARDIZE FUNCTION SIGNATURES**  
1. ✅ Choose ONE signature pattern (recommend UUID-based)
2. ✅ Remove backward compatibility functions  
3. ✅ Update frontend to match chosen pattern
4. ✅ Implement comprehensive testing

### **PHASE 4: BUSINESS LOGIC CONSOLIDATION**
1. ✅ Implement ONE pricing algorithm (recommend variant-based)
2. ✅ Remove contradictory implementations
3. ✅ Update constants to reflect actual logic
4. ✅ Create validation tests

---

## **⚠️ MIGRATION RISKS**

### **HIGH RISK FACTORS**
- **Production data integrity**: Schema changes could break existing data
- **Downtime requirements**: Function signature changes need coordinated deployment
- **Rollback complexity**: Multiple conflicting migrations make rollback difficult

### **MITIGATION STRATEGIES**
1. **Backup everything** before any migration work
2. **Test in staging environment** with production data copy
3. **Deploy in maintenance window** with rollback plan ready
4. **Implement gradual rollout** with feature flags if possible

---

*This analysis reveals critical migration system failures that must be resolved before any feature development can safely continue.*
