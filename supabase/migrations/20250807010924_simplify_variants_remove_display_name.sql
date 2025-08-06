-- Migration: Simplify variants by removing display_name
-- Keep only variant_name as the single source of truth

-- Remove the restrictive constraint on variant_name format FIRST
-- This allows user-friendly names like "Trio", "Band", "DJ" instead of forcing "trio", "band", "dj"
ALTER TABLE project_variants DROP CONSTRAINT IF EXISTS valid_variant_name;

-- Now copy display_name values to variant_name for any variants that might have different values
UPDATE project_variants 
SET variant_name = display_name 
WHERE variant_name != display_name AND display_name IS NOT NULL;

-- Add a simpler constraint that just prevents empty names and overly long names
ALTER TABLE project_variants 
ADD CONSTRAINT simple_variant_name 
CHECK (char_length(variant_name) >= 1 AND char_length(variant_name) <= 50);

-- Drop the display_name column since we'll use variant_name for everything
ALTER TABLE project_variants DROP COLUMN IF EXISTS display_name;

-- Drop the display_name constraint since the column is gone
ALTER TABLE project_variants DROP CONSTRAINT IF EXISTS valid_display_name;

-- Update the comment
COMMENT ON COLUMN project_variants.variant_name IS 'Variant name used for both technical identification and user display';

-- Verify the changes
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Check if display_name column was successfully removed
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_variants' 
        AND column_name = 'display_name'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE EXCEPTION 'display_name column still exists after migration';
    ELSE
        RAISE NOTICE 'Successfully simplified project_variants table - display_name removed, variant_name constraint relaxed';
    END IF;
END $$;