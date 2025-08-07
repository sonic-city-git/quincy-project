# 🗄️ DATABASE MIGRATION STRATEGY

## **📋 MIGRATION OVERVIEW**

**Objective**: Extend existing schema to support project variants without breaking current functionality.

**Approach**: Additive schema changes with backward compatibility guarantees.

---

## **🔍 CURRENT SCHEMA ANALYSIS**

### **Existing Tables (Preserved)**
```sql
-- Core project structure (unchanged)
projects (id, name, project_type_id, customer_id, owner_id)
project_types (id, code, name) -- artist, corporate, broadcast, dry_hire

-- Current template system (extended)
project_roles (id, project_id, role_id, daily_rate, preferred_id)
project_equipment (id, project_id, equipment_id, quantity, group_id)
project_equipment_groups (id, project_id, name, sort_order)

-- Event assignment system (unchanged)
project_events (id, project_id, date, name, event_type_id)
project_event_roles (id, project_id, event_id, role_id, crew_member_id)
project_event_equipment (id, project_id, event_id, equipment_id, quantity)
```

### **Key Constraints to Preserve**
- All existing foreign key relationships
- Unique constraints on event roles/equipment
- Cascade deletion behaviors  
- Rate calculation logic

---

## **📝 MIGRATION SCRIPT SEQUENCE**

### **Migration 1: Add Variant Columns**
```sql
-- File: 001_add_variant_columns.sql
-- Add variant support to existing tables (non-breaking)

-- Add variant column to equipment groups
ALTER TABLE project_equipment_groups 
ADD COLUMN variant_name TEXT DEFAULT 'default' NOT NULL;

-- Add variant column to project roles
ALTER TABLE project_roles
ADD COLUMN variant_name TEXT DEFAULT 'default' NOT NULL;

-- Update constraints to include variant
DROP INDEX IF EXISTS idx_project_equipment_groups_project;
CREATE UNIQUE INDEX idx_project_equipment_groups_project_variant 
ON project_equipment_groups(project_id, name, variant_name);

-- Add performance indexes
CREATE INDEX idx_project_equipment_groups_variant 
ON project_equipment_groups(project_id, variant_name);

CREATE INDEX idx_project_roles_variant 
ON project_roles(project_id, variant_name);
```

### **Migration 2: Create Variant Configuration Table**
```sql
-- File: 002_create_variant_config.sql
-- Central variant configuration

CREATE TABLE project_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    variant_name TEXT NOT NULL,
    display_name TEXT NOT NULL, -- User-friendly name: "Trio", "Band", "DJ"
    description TEXT,           -- Optional description
    is_default BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique variant names per project
    CONSTRAINT unique_project_variant UNIQUE(project_id, variant_name),
    
    -- Only one default variant per project
    CONSTRAINT unique_default_per_project 
    EXCLUDE (project_id WITH =) WHERE (is_default = true),
    
    -- Variant names must be valid identifiers
    CONSTRAINT valid_variant_name 
    CHECK (variant_name ~ '^[a-z0-9_]+$')
);

-- Indexes for performance
CREATE INDEX idx_project_variants_project ON project_variants(project_id);
CREATE INDEX idx_project_variants_default ON project_variants(project_id, is_default);

-- Enable RLS
ALTER TABLE project_variants ENABLE ROW LEVEL SECURITY;
```

### **Migration 3: Initialize Default Variants**
```sql
-- File: 003_initialize_defaults.sql
-- Create default variants for existing artist projects

-- Get artist project type ID
DO $$
DECLARE
    artist_type_id UUID;
BEGIN
    SELECT id INTO artist_type_id 
    FROM project_types 
    WHERE code = 'artist';
    
    IF artist_type_id IS NOT NULL THEN
        -- Create default variant for all artist projects
        INSERT INTO project_variants (project_id, variant_name, display_name, is_default)
        SELECT 
            p.id, 
            'default', 
            'Standard Setup', 
            true
        FROM projects p 
        WHERE p.project_type_id = artist_type_id
        ON CONFLICT (project_id, variant_name) DO NOTHING;
    END IF;
END $$;
```

### **Migration 4: Data Validation & Integrity**
```sql
-- File: 004_validate_migration.sql
-- Ensure data integrity after migration

-- Verify all existing data is preserved
DO $$
BEGIN
    -- Check that all project equipment groups have valid variants
    IF EXISTS (
        SELECT 1 FROM project_equipment_groups 
        WHERE variant_name IS NULL OR variant_name = ''
    ) THEN
        RAISE EXCEPTION 'Invalid variant_name found in project_equipment_groups';
    END IF;
    
    -- Check that all project roles have valid variants
    IF EXISTS (
        SELECT 1 FROM project_roles 
        WHERE variant_name IS NULL OR variant_name = ''
    ) THEN
        RAISE EXCEPTION 'Invalid variant_name found in project_roles';
    END IF;
    
    -- Verify foreign key integrity
    IF EXISTS (
        SELECT 1 FROM project_equipment_groups peg
        LEFT JOIN projects p ON peg.project_id = p.id
        WHERE p.id IS NULL
    ) THEN
        RAISE EXCEPTION 'Orphaned project_equipment_groups found';
    END IF;
    
    RAISE NOTICE 'Migration validation passed successfully';
END $$;
```

---

## **🔄 ROLLBACK STRATEGY**

### **Emergency Rollback Script**
```sql
-- File: rollback_variants.sql
-- EMERGENCY ONLY: Complete rollback of variant system

-- Drop variant configuration table
DROP TABLE IF EXISTS project_variants CASCADE;

-- Remove variant columns (this will reset all to 'default')
ALTER TABLE project_equipment_groups DROP COLUMN IF EXISTS variant_name;
ALTER TABLE project_roles DROP COLUMN IF EXISTS variant_name;

-- Restore original indexes
DROP INDEX IF EXISTS idx_project_equipment_groups_project_variant;
CREATE UNIQUE INDEX idx_project_equipment_groups_project 
ON project_equipment_groups(project_id, name);

DROP INDEX IF EXISTS idx_project_equipment_groups_variant;
DROP INDEX IF EXISTS idx_project_roles_variant;

-- Verify rollback
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_variants') THEN
        RAISE EXCEPTION 'Rollback failed: project_variants table still exists';
    END IF;
    
    RAISE NOTICE 'Variant system rollback completed successfully';
END $$;
```

---

## **🧪 TESTING PROCEDURES**

### **Pre-Migration Testing**
```sql
-- Backup validation
CREATE TABLE test_project_equipment_groups_backup AS 
SELECT * FROM project_equipment_groups;

CREATE TABLE test_project_roles_backup AS 
SELECT * FROM project_roles;

-- Record counts for validation
SELECT 
    'project_equipment_groups' as table_name,
    count(*) as record_count
FROM project_equipment_groups
UNION ALL
SELECT 
    'project_roles' as table_name,
    count(*) as record_count  
FROM project_roles;
```

### **Post-Migration Validation**
```sql
-- Verify data integrity
SELECT 
    'PASS' as status,
    'All equipment groups have variants' as test
WHERE NOT EXISTS (
    SELECT 1 FROM project_equipment_groups 
    WHERE variant_name IS NULL
)
UNION ALL
SELECT 
    'PASS' as status,
    'All roles have variants' as test
WHERE NOT EXISTS (
    SELECT 1 FROM project_roles 
    WHERE variant_name IS NULL
)
UNION ALL
SELECT 
    'PASS' as status,
    'Record counts match' as test
WHERE (
    SELECT count(*) FROM project_equipment_groups
) = (
    SELECT count(*) FROM test_project_equipment_groups_backup
)
AND (
    SELECT count(*) FROM project_roles
) = (
    SELECT count(*) FROM test_project_roles_backup
);
```

---

## **⚡ PERFORMANCE CONSIDERATIONS**

### **Index Strategy**
```sql
-- Optimized indexes for variant queries
CREATE INDEX CONCURRENTLY idx_project_equipment_groups_variant_lookup
ON project_equipment_groups(project_id, variant_name) 
INCLUDE (name, sort_order, total_price);

CREATE INDEX CONCURRENTLY idx_project_roles_variant_lookup  
ON project_roles(project_id, variant_name)
INCLUDE (role_id, daily_rate, preferred_id);
```

### **Query Optimization**
- **Variant Filtering**: Single index lookup with variant name
- **Default Fallback**: Efficient fallback to 'default' variant
- **Bulk Operations**: Batch operations for variant management

---

## **🚨 RISK ASSESSMENT**

### **High Risk**
- **Data Loss**: Multiple backup strategies implemented
- **Foreign Key Violations**: Comprehensive constraint testing  
- **Performance Degradation**: Indexes designed for new query patterns

### **Medium Risk**  
- **Application Errors**: Gradual rollout with feature flags
- **User Confusion**: Clear documentation and training

### **Low Risk**
- **Rollback Complexity**: Simple additive changes, clean rollback
- **Concurrent Access**: Standard migration locking procedures

---

## **📊 MIGRATION TIMELINE**

### **Phase 1: Preparation (Day 1)**
- [ ] Database backup and validation
- [ ] Migration script testing in staging
- [ ] Performance baseline measurements

### **Phase 2: Schema Extension (Day 2)**  
- [ ] Execute migrations 001-002
- [ ] Validate schema changes
- [ ] Test application compatibility

### **Phase 3: Data Initialization (Day 3)**
- [ ] Execute migration 003 (default variants)
- [ ] Validate data integrity  
- [ ] Performance testing

### **Phase 4: Validation & Documentation (Day 4)**
- [ ] Execute migration 004 (validation)
- [ ] Document any issues or deviations
- [ ] Prepare rollback procedures if needed

---

**Next Steps**: Execute migrations in staging environment with comprehensive testing.