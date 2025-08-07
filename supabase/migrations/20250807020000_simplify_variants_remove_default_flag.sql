-- Migration: Remove is_default flag and use creation order instead
-- The first created variant (by created_at) is considered the "default"
-- Usually named "Default" but not enforced

-- Step 1: Update any unnamed first variants to be called "Default"
UPDATE project_variants 
SET variant_name = 'Default'
WHERE is_default = true 
  AND variant_name IN ('default', '');

-- Step 2: Remove the unique constraint on is_default
DROP INDEX IF EXISTS idx_project_variants_unique_default;

-- Step 3: Remove the is_default column
ALTER TABLE project_variants DROP COLUMN IF EXISTS is_default;

-- Step 4: Add a comment explaining the new convention
COMMENT ON TABLE project_variants IS 'Project variant configurations. The earliest created variant (by created_at) is considered the default/base variant.';

-- Step 5: Ensure we have an index for efficient "find first variant" queries
CREATE INDEX IF NOT EXISTS idx_project_variants_created_order 
ON project_variants(project_id, created_at, id);

-- Step 6: Create a helper view for finding default variants (optional, for convenience)
CREATE OR REPLACE VIEW project_default_variants AS
SELECT DISTINCT ON (project_id) 
  *,
  true as is_first_variant
FROM project_variants 
ORDER BY project_id, created_at ASC, id ASC;

-- Step 7: Update the auto-creation trigger to use "Default" naming
CREATE OR REPLACE FUNCTION create_default_variant_for_project()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default variant for the new project (ignore conflicts)
    INSERT INTO project_variants (project_id, variant_name, description, sort_order)
    VALUES (
        NEW.id,
        'Default',  -- Changed from 'default' to 'Default'
        'Default configuration for equipment and crew',
        0
    )
    ON CONFLICT (project_id, variant_name) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verification: Show the updated structure
DO $$
BEGIN
    -- Check that is_default column was removed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_variants' 
        AND column_name = 'is_default'
    ) THEN
        RAISE EXCEPTION 'is_default column still exists after migration';
    ELSE
        RAISE NOTICE 'Successfully simplified project_variants table - is_default flag removed, using creation order instead';
    END IF;
END $$;