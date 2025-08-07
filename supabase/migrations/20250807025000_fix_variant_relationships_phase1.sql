-- Migration: Fix Variant Relationships - Phase 1 (Add UUID Foreign Keys)
-- This migration adds proper UUID-based foreign key columns alongside existing variant_name columns
-- Data migration preserves all existing relationships during the transition

-- ============================================================================
-- PHASE 1: ADD NEW variant_id COLUMNS 
-- ============================================================================

-- Add variant_id to project_events
ALTER TABLE project_events 
ADD COLUMN IF NOT EXISTS variant_id UUID;

-- Add variant_id to project_equipment  
ALTER TABLE project_equipment
ADD COLUMN IF NOT EXISTS variant_id UUID;

-- Add variant_id to project_roles
ALTER TABLE project_roles 
ADD COLUMN IF NOT EXISTS variant_id UUID;

-- Add variant_id to project_equipment_groups
ALTER TABLE project_equipment_groups
ADD COLUMN IF NOT EXISTS variant_id UUID;

-- ============================================================================
-- PHASE 2: POPULATE variant_id FROM variant_name LOOKUPS
-- ============================================================================

-- Populate project_events.variant_id
UPDATE project_events pe
SET variant_id = pv.id
FROM project_variants pv 
WHERE pe.project_id = pv.project_id 
  AND pe.variant_name = pv.variant_name
  AND pe.variant_id IS NULL;

-- Populate project_equipment.variant_id  
UPDATE project_equipment pe
SET variant_id = pv.id
FROM project_variants pv
WHERE pe.project_id = pv.project_id
  AND pe.variant_name = pv.variant_name  
  AND pe.variant_id IS NULL;

-- Populate project_roles.variant_id
UPDATE project_roles pr
SET variant_id = pv.id  
FROM project_variants pv
WHERE pr.project_id = pv.project_id
  AND pr.variant_name = pv.variant_name
  AND pr.variant_id IS NULL;

-- Populate project_equipment_groups.variant_id
UPDATE project_equipment_groups peg
SET variant_id = pv.id
FROM project_variants pv 
WHERE peg.project_id = pv.project_id
  AND peg.variant_name = pv.variant_name
  AND peg.variant_id IS NULL;

-- ============================================================================
-- PHASE 3: HANDLE ORPHANED RECORDS (variant_name doesn't match any variant)
-- ============================================================================

-- Find and report orphaned events
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM project_events pe
    WHERE pe.variant_id IS NULL;
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Found % orphaned project_events with invalid variant_name', orphaned_count;
        
        -- Option 1: Link to default variant for same project
        UPDATE project_events pe
        SET variant_id = pv.id
        FROM project_variants pv
        WHERE pe.project_id = pv.project_id
          AND pv.variant_name = 'default'  -- Link to default variant
          AND pe.variant_id IS NULL;
          
        RAISE NOTICE 'Linked orphaned events to default variants';
    END IF;
END $$;

-- Handle orphaned equipment the same way
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM project_equipment pe
    WHERE pe.variant_id IS NULL;
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Found % orphaned project_equipment with invalid variant_name', orphaned_count;
        
        UPDATE project_equipment pe
        SET variant_id = pv.id
        FROM project_variants pv
        WHERE pe.project_id = pv.project_id
          AND pv.variant_name = 'default' 
          AND pe.variant_id IS NULL;
          
        RAISE NOTICE 'Linked orphaned equipment to default variants';
    END IF;
END $$;

-- Handle orphaned roles
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count 
    FROM project_roles pr
    WHERE pr.variant_id IS NULL;
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Found % orphaned project_roles with invalid variant_name', orphaned_count;
        
        UPDATE project_roles pr
        SET variant_id = pv.id
        FROM project_variants pv
        WHERE pr.project_id = pv.project_id
          AND pv.variant_name = 'default'
          AND pr.variant_id IS NULL;
          
        RAISE NOTICE 'Linked orphaned roles to default variants';
    END IF;
END $$;

-- Handle orphaned equipment groups
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM project_equipment_groups peg
    WHERE peg.variant_id IS NULL;
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Found % orphaned project_equipment_groups with invalid variant_name', orphaned_count;
        
        UPDATE project_equipment_groups peg
        SET variant_id = pv.id
        FROM project_variants pv
        WHERE peg.project_id = pv.project_id
          AND pv.variant_name = 'default'
          AND peg.variant_id IS NULL;
          
        RAISE NOTICE 'Linked orphaned equipment groups to default variants';
    END IF;
END $$;

-- ============================================================================
-- PHASE 4: ADD FOREIGN KEY CONSTRAINTS (NOT NULL + FK)
-- ============================================================================

-- Make variant_id NOT NULL (all should be populated now)
ALTER TABLE project_events 
ALTER COLUMN variant_id SET NOT NULL;

ALTER TABLE project_equipment
ALTER COLUMN variant_id SET NOT NULL;

ALTER TABLE project_roles
ALTER COLUMN variant_id SET NOT NULL;

ALTER TABLE project_equipment_groups  
ALTER COLUMN variant_id SET NOT NULL;

-- Add foreign key constraints with CASCADE for data integrity
ALTER TABLE project_events
ADD CONSTRAINT project_events_variant_id_fkey 
FOREIGN KEY (variant_id) REFERENCES project_variants(id) ON DELETE CASCADE;

ALTER TABLE project_equipment
ADD CONSTRAINT project_equipment_variant_id_fkey
FOREIGN KEY (variant_id) REFERENCES project_variants(id) ON DELETE CASCADE;

ALTER TABLE project_roles  
ADD CONSTRAINT project_roles_variant_id_fkey
FOREIGN KEY (variant_id) REFERENCES project_variants(id) ON DELETE CASCADE;

ALTER TABLE project_equipment_groups
ADD CONSTRAINT project_equipment_groups_variant_id_fkey
FOREIGN KEY (variant_id) REFERENCES project_variants(id) ON DELETE CASCADE;

-- ============================================================================
-- PHASE 5: ADD PERFORMANCE INDEXES
-- ============================================================================

-- Replace variant_name indexes with variant_id indexes
CREATE INDEX IF NOT EXISTS idx_project_events_variant_id 
ON project_events(project_id, variant_id);

CREATE INDEX IF NOT EXISTS idx_project_events_variant_id_date
ON project_events(project_id, variant_id, date);

CREATE INDEX IF NOT EXISTS idx_project_equipment_variant_id
ON project_equipment(project_id, variant_id);

CREATE INDEX IF NOT EXISTS idx_project_equipment_variant_id_lookup
ON project_equipment(project_id, variant_id) 
INCLUDE (equipment_id, quantity, group_id);

CREATE INDEX IF NOT EXISTS idx_project_roles_variant_id
ON project_roles(project_id, variant_id);

CREATE INDEX IF NOT EXISTS idx_project_roles_variant_id_lookup  
ON project_roles(project_id, variant_id)
INCLUDE (role_id, daily_rate, preferred_id);

CREATE INDEX IF NOT EXISTS idx_project_equipment_groups_variant_id
ON project_equipment_groups(project_id, variant_id);

CREATE INDEX IF NOT EXISTS idx_project_equipment_groups_variant_id_lookup
ON project_equipment_groups(project_id, variant_id)
INCLUDE (name, sort_order, total_price);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    events_without_fk INTEGER;
    equipment_without_fk INTEGER; 
    roles_without_fk INTEGER;
    groups_without_fk INTEGER;
BEGIN
    -- Check that all records now have valid variant_id foreign keys
    SELECT COUNT(*) INTO events_without_fk
    FROM project_events pe
    LEFT JOIN project_variants pv ON pe.variant_id = pv.id
    WHERE pv.id IS NULL;
    
    SELECT COUNT(*) INTO equipment_without_fk  
    FROM project_equipment pe
    LEFT JOIN project_variants pv ON pe.variant_id = pv.id
    WHERE pv.id IS NULL;
    
    SELECT COUNT(*) INTO roles_without_fk
    FROM project_roles pr  
    LEFT JOIN project_variants pv ON pr.variant_id = pv.id
    WHERE pv.id IS NULL;
    
    SELECT COUNT(*) INTO groups_without_fk
    FROM project_equipment_groups peg
    LEFT JOIN project_variants pv ON peg.variant_id = pv.id  
    WHERE pv.id IS NULL;
    
    IF events_without_fk > 0 OR equipment_without_fk > 0 OR roles_without_fk > 0 OR groups_without_fk > 0 THEN
        RAISE EXCEPTION 'Migration failed: Found records with invalid variant_id foreign keys. Events: %, Equipment: %, Roles: %, Groups: %', 
            events_without_fk, equipment_without_fk, roles_without_fk, groups_without_fk;
    END IF;
    
    RAISE NOTICE '✅ Migration successful! All variant relationships now use proper UUID foreign keys.';
    RAISE NOTICE 'Next: Update application code to use variant_id instead of variant_name';
    RAISE NOTICE 'Future: Remove variant_name columns in Phase 2 migration (after app update)';
END $$;