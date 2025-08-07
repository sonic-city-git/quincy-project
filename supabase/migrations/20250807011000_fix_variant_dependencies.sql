-- Migration: Fix variant dependencies and ensure proper schema
-- This migration safely handles variant columns and constraints

-- First ensure the variant_name column exists on project_events
ALTER TABLE project_events 
ADD COLUMN IF NOT EXISTS variant_name TEXT DEFAULT 'default' NOT NULL;

-- Drop any existing constraints on project_events.variant_name
ALTER TABLE project_events DROP CONSTRAINT IF EXISTS valid_event_variant;
ALTER TABLE project_events DROP CONSTRAINT IF EXISTS simple_event_variant;

-- Add a simple constraint that allows user-friendly names like "Trio", "Band", "DJ Set"
ALTER TABLE project_events
ADD CONSTRAINT simple_event_variant 
CHECK (char_length(variant_name) >= 1 AND char_length(variant_name) <= 50);

-- Add indexes for performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_project_events_variant 
ON project_events(project_id, variant_name);

CREATE INDEX IF NOT EXISTS idx_project_events_variant_date
ON project_events(project_id, variant_name, date);

-- Verify the setup
DO $$
BEGIN
    -- Check that variant_name column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_events' 
        AND column_name = 'variant_name'
    ) THEN
        RAISE EXCEPTION 'variant_name column does not exist on project_events table';
    END IF;
    
    -- Check that the constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'project_events' 
        AND constraint_name = 'simple_event_variant'
    ) THEN
        RAISE EXCEPTION 'simple_event_variant constraint was not created';
    END IF;
    
    RAISE NOTICE 'Project events variant setup completed successfully';
END $$;