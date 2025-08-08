# ⚙️ **QUINCY APP LOGIC** 
*Non-Adjustable Technical Foundation*

---

## **📋 OVERVIEW**

This document defines the **immutable technical architecture** of Quincy. These are core system behaviors that should **NOT** be changed without careful consideration, as they form the foundation upon which all business logic operates.

---

## **🗄️ DATABASE SCHEMA** (FIXED)

### **Core Entity Relationships**
```sql
-- Project hierarchy (IMMUTABLE)
projects 
├── 1:N project_variants (every project has ≥1 variant)
│   ├── 1:N project_roles (crew roles per variant)
│   ├── 1:N project_equipment (equipment per variant)
│   └── 1:N project_equipment_groups (equipment organization)
└── 1:N project_events (events reference variants)
    ├── 1:N project_event_roles (crew assignments)
    └── 1:N project_event_equipment (equipment assignments)
```

### **Foreign Key Constraints** (IMMUTABLE)
```sql
-- Variant relationships (CASCADE DELETE)
project_events.variant_id → project_variants.id
project_roles.variant_id → project_variants.id  
project_equipment.variant_id → project_variants.id
project_equipment_groups.variant_id → project_variants.id

-- Event relationships (CASCADE DELETE)
project_event_roles.event_id → project_events.id
project_event_equipment.event_id → project_events.id
```

### **Data Validation** (FIXED)
```sql
-- Variant constraints
variant_name: /^[a-z0-9_]+$/ AND length 1-50
is_default: boolean (exactly one per project)
sort_order: integer >= 0

-- Project constraints  
project_number: auto-increment sequence
project_type: enum('artist', 'corporate', 'broadcast', 'dry_hire')

-- Event constraints
status: enum('proposed', 'confirmed', 'invoice ready', 'invoiced', 'cancelled')
date: required, future dates preferred
location: required text field
```

---

## **🔄 SYNC ARCHITECTURE** (FIXED)

### **Delete + Insert Pattern**
```typescript
// Core sync algorithm (IMMUTABLE)
async function syncEventResources(eventId: string, variantId: string) {
  // 1. Clean slate approach
  await supabase
    .from('project_event_roles')
    .delete()
    .eq('event_id', eventId);
    
  await supabase
    .from('project_event_equipment') 
    .delete()
    .eq('event_id', eventId);

  // 2. Fresh insert from variant template
  await supabase.rpc('sync_event_crew', {
    p_event_id: eventId,
    p_project_id: projectId,
    p_variant_id: variantId
  });
  
  await supabase.rpc('sync_event_equipment_unified', {
    p_event_id: eventId,
    p_project_id: projectId, 
    p_variant_id: variantId
  });

  // 3. Recalculate pricing
  await updateEventPricing(eventId);
}
```

### **Why Delete + Insert?**
- **🎯 Consistency**: Ensures event exactly matches variant
- **🧹 Clean**: No orphaned or stale assignments
- **🔒 Reliable**: No complex merge logic or edge cases
- **⚡ Performance**: Single operation, optimized indexes

---

## **💰 PRICING CALCULATION FLOW** (FIXED)

### **Order of Operations** (IMMUTABLE)
```sql
-- 1. Sync resources from variant
CALL sync_event_crew(event_id, project_id, variant_id);
CALL sync_event_equipment_unified(event_id, project_id, variant_id);

-- 2. Calculate crew pricing
UPDATE project_events 
SET crew_price = (calculation_logic)  -- Business rule
WHERE id = event_id;

-- 3. Calculate equipment pricing  
UPDATE project_events
SET equipment_price = (calculation_logic)  -- Business rule
WHERE id = event_id;

-- 4. Update total
UPDATE project_events 
SET total_price = COALESCE(crew_price, 0) + COALESCE(equipment_price, 0)
WHERE id = event_id;

-- 5. Trigger PGA recalculation for project
-- (PGA = Per Gig Average for project overview)
```

### **Database Functions** (IMMUTABLE SIGNATURES)
```sql
-- RPC function contracts
sync_event_crew(p_event_id uuid, p_project_id uuid, p_variant_id uuid)
sync_event_equipment_unified(p_event_id uuid, p_project_id uuid, p_variant_id uuid)

-- Return: void (success) | error (with message)
-- Side effects: Updates project_events pricing columns
```

---

## **🎛️ API PATTERNS** (FIXED)

### **Frontend Hook Architecture**
```typescript
// Variant-scoped hooks (IMMUTABLE PATTERN)
useVariantCrew(projectId: string, variantName: string)
useVariantEquipment(projectId: string, variantName: string)
useVariantData(projectId: string, variantName: string) // Combined

// Event-scoped hooks (IMMUTABLE PATTERN)
useUnifiedEventSync(event: CalendarEvent)
useEventData(eventId: string)

// Project-scoped hooks (IMMUTABLE PATTERN)  
useProjectVariants(projectId: string)
useProjectEvents(projectId: string)
```

### **Data Flow Architecture**
```
UI Component
    ↓ (user action)
Hook (useVariantCrew, etc.)
    ↓ (mutation)
Supabase Client
    ↓ (SQL/RPC)
Database Functions
    ↓ (side effects)
Real-time Updates
    ↓ (subscription)
UI Component (re-render)
```

---

## **🔒 INVARIANTS** (NEVER CHANGE)

### **System Guarantees**
1. **Every project has ≥1 variant** (enforced by triggers)
2. **Exactly one default variant per project** (unique index)
3. **Events always reference valid variants** (FK constraint)
4. **Sync operations are atomic** (transaction-wrapped)
5. **Pricing is eventually consistent** (calculated after sync)

### **Data Integrity Rules**
```sql
-- These constraints MUST be maintained
CONSTRAINT unique_project_variant UNIQUE(project_id, variant_name)
CONSTRAINT unique_default_variant UNIQUE(project_id) WHERE is_default = true
CONSTRAINT valid_variant_name CHECK (variant_name ~ '^[a-z0-9_]+$')
CONSTRAINT non_negative_prices CHECK (crew_price >= 0 AND equipment_price >= 0)
```

---

## **🚨 CRITICAL WARNINGS**

### **DO NOT MODIFY**
- Database schema relationships
- Sync function signatures  
- Delete + Insert pattern
- Foreign key constraints
- Data validation rules

### **SAFE TO EXTEND**
- Add new columns (with defaults)
- Add new indexes for performance
- Add new hooks following patterns
- Add new UI components
- Add business logic on top

---

*This document should be updated only when making fundamental architectural changes that affect the entire system.*
