-- Migration: Add variant support to existing tables (non-breaking)
-- This migration extends existing tables with variant_name columns
-- All existing data remains valid with 'default' variant

-- Add variant column to equipment groups
ALTER TABLE project_equipment_groups 
ADD COLUMN IF NOT EXISTS variant_name TEXT DEFAULT 'default' NOT NULL;

-- Add variant column to project roles
ALTER TABLE project_roles
ADD COLUMN IF NOT EXISTS variant_name TEXT DEFAULT 'default' NOT NULL;

-- Update unique constraint for equipment groups to include variant
-- Drop existing constraint if it exists
ALTER TABLE project_equipment_groups 
DROP CONSTRAINT IF EXISTS project_equipment_groups_project_id_name_key;

-- Create new unique constraint including variant
ALTER TABLE project_equipment_groups
ADD CONSTRAINT project_equipment_groups_project_variant_name_key 
UNIQUE (project_id, name, variant_name);

-- Add performance indexes for variant queries
CREATE INDEX IF NOT EXISTS idx_project_equipment_groups_variant 
ON project_equipment_groups(project_id, variant_name);

CREATE INDEX IF NOT EXISTS idx_project_roles_variant 
ON project_roles(project_id, variant_name);

-- Add optimized indexes for common variant lookup patterns
CREATE INDEX IF NOT EXISTS idx_project_equipment_groups_variant_lookup
ON project_equipment_groups(project_id, variant_name) 
INCLUDE (name, sort_order, total_price);

CREATE INDEX IF NOT EXISTS idx_project_roles_variant_lookup  
ON project_roles(project_id, variant_name)
INCLUDE (role_id, daily_rate, preferred_id);

-- Verify that all existing records now have 'default' variant
DO $$
BEGIN
    -- Check equipment groups
    IF EXISTS (
        SELECT 1 FROM project_equipment_groups 
        WHERE variant_name IS NULL OR variant_name = ''
    ) THEN
        RAISE EXCEPTION 'Some project_equipment_groups have invalid variant_name';
    END IF;
    
    -- Check project roles
    IF EXISTS (
        SELECT 1 FROM project_roles 
        WHERE variant_name IS NULL OR variant_name = ''
    ) THEN
        RAISE EXCEPTION 'Some project_roles have invalid variant_name';
    END IF;
    
    RAISE NOTICE 'Variant columns added successfully. All existing data preserved with default variant.';
END $$;