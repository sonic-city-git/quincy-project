-- Migration: Add variant connection to events
-- This enables events to remember which variant they were created with

-- Add variant_name column to project_events table
ALTER TABLE project_events 
ADD COLUMN IF NOT EXISTS variant_name TEXT DEFAULT 'default' NOT NULL;

-- Add foreign key constraint to ensure variant exists
-- Note: Using a check constraint instead of FK since variant names are not primary keys
ALTER TABLE project_events
ADD CONSTRAINT valid_event_variant 
CHECK (variant_name ~ '^[a-z0-9_]+$' AND char_length(variant_name) >= 1 AND char_length(variant_name) <= 50);

-- Add index for performance when querying events by variant
CREATE INDEX IF NOT EXISTS idx_project_events_variant 
ON project_events(project_id, variant_name);

-- Add composite index for common event queries
CREATE INDEX IF NOT EXISTS idx_project_events_variant_date
ON project_events(project_id, variant_name, date);

-- Verify all existing events now have 'default' variant
DO $$
BEGIN
    -- Check that no events have invalid variant names
    IF EXISTS (
        SELECT 1 FROM project_events 
        WHERE variant_name IS NULL OR variant_name = '' OR variant_name !~ '^[a-z0-9_]+$'
    ) THEN
        RAISE EXCEPTION 'Some project_events have invalid variant_name values';
    END IF;
    
    RAISE NOTICE 'Event variant column added successfully. All existing events assigned to default variant.';
END $$;