-- Migration: Add variant_name column to project_equipment table
-- This was missed in the initial variant system migration

-- Add variant column to project equipment
ALTER TABLE project_equipment 
ADD COLUMN IF NOT EXISTS variant_name TEXT DEFAULT 'default' NOT NULL;

-- Add performance index for variant queries
CREATE INDEX IF NOT EXISTS idx_project_equipment_variant 
ON project_equipment(project_id, variant_name);

-- Add optimized index for common variant lookup patterns
CREATE INDEX IF NOT EXISTS idx_project_equipment_variant_lookup
ON project_equipment(project_id, variant_name) 
INCLUDE (equipment_id, quantity, group_id);

-- Verify that all existing records now have 'default' variant
DO $$
BEGIN
    -- Check project equipment
    IF EXISTS (
        SELECT 1 FROM project_equipment 
        WHERE variant_name IS NULL OR variant_name = ''
    ) THEN
        RAISE EXCEPTION 'Some project_equipment have invalid variant_name';
    END IF;
    
    RAISE NOTICE 'Project equipment variant column added successfully. All existing data preserved with default variant.';
END $$;