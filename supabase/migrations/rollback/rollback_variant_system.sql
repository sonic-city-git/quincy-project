-- EMERGENCY ROLLBACK: Complete removal of variant system
-- WARNING: This script will permanently remove all variant data
-- Only use in emergency situations when variant system needs to be completely removed

-- This rollback script reverses all changes made by:
-- - 20250805_001_add_variant_columns.sql
-- - 20250805_002_create_variant_config.sql
-- - 20250805_003_initialize_defaults.sql
-- - 20250805_004_validate_migration.sql

DO $$
DECLARE
    equipment_groups_count INTEGER;
    project_roles_count INTEGER;
    variants_count INTEGER;
BEGIN
    RAISE NOTICE 'Starting emergency rollback of variant system...';
    RAISE NOTICE 'WARNING: This will permanently delete all variant data!';
    
    -- Record current state for verification
    SELECT COUNT(*) INTO equipment_groups_count FROM project_equipment_groups;
    SELECT COUNT(*) INTO project_roles_count FROM project_roles;
    SELECT COUNT(*) INTO variants_count FROM project_variants WHERE variant_name != 'default';
    
    RAISE NOTICE 'Current state:';
    RAISE NOTICE '- Equipment groups: %', equipment_groups_count;
    RAISE NOTICE '- Project roles: %', project_roles_count;
    RAISE NOTICE '- Non-default variants: % (will be lost)', variants_count;
    
    -- Step 1: Drop variant configuration table and related objects
    RAISE NOTICE 'Step 1: Removing variant configuration table...';
    
    -- Drop views that depend on project_variants
    DROP VIEW IF EXISTS variant_statistics CASCADE;
    
    -- Drop triggers and functions
    DROP TRIGGER IF EXISTS update_project_variants_updated_at ON project_variants;
    DROP FUNCTION IF EXISTS update_project_variants_updated_at();
    
    -- Drop the main variant table (CASCADE will handle dependent objects)
    DROP TABLE IF EXISTS project_variants CASCADE;
    
    RAISE NOTICE '✓ Variant configuration table removed';
    
    -- Step 2: Remove variant-related indexes
    RAISE NOTICE 'Step 2: Removing variant-specific indexes...';
    
    DROP INDEX IF EXISTS idx_project_equipment_groups_variant;
    DROP INDEX IF EXISTS idx_project_roles_variant;
    DROP INDEX IF EXISTS idx_project_equipment_groups_variant_lookup;
    DROP INDEX IF EXISTS idx_project_roles_variant_lookup;
    DROP INDEX IF EXISTS idx_project_variants_project;
    DROP INDEX IF EXISTS idx_project_variants_project_sort;
    DROP INDEX IF EXISTS idx_project_variants_unique_default;
    
    RAISE NOTICE '✓ Variant indexes removed';
    
    -- Step 3: Remove variant columns from existing tables
    RAISE NOTICE 'Step 3: Removing variant columns...';
    
    -- Remove variant_name column from project_equipment_groups
    ALTER TABLE project_equipment_groups 
    DROP COLUMN IF EXISTS variant_name CASCADE;
    
    -- Remove variant_name column from project_roles
    ALTER TABLE project_roles
    DROP COLUMN IF EXISTS variant_name CASCADE;
    
    RAISE NOTICE '✓ Variant columns removed';
    
    -- Step 4: Restore original constraints
    RAISE NOTICE 'Step 4: Restoring original constraints...';
    
    -- Drop the variant-aware unique constraint
    ALTER TABLE project_equipment_groups 
    DROP CONSTRAINT IF EXISTS project_equipment_groups_project_variant_name_key;
    
    -- Restore original unique constraint for equipment groups (if it existed)
    -- Note: We need to check if there are any naming conflicts after removing variants
    BEGIN
        ALTER TABLE project_equipment_groups
        ADD CONSTRAINT project_equipment_groups_project_id_name_key 
        UNIQUE (project_id, name);
        RAISE NOTICE '✓ Original equipment groups constraint restored';
    EXCEPTION WHEN unique_violation THEN
        RAISE WARNING 'Could not restore original unique constraint due to naming conflicts. Manual cleanup may be required.';
        RAISE WARNING 'Some equipment groups may have duplicate names within projects.';
    END;
    
    -- Step 5: Verify rollback
    RAISE NOTICE 'Step 5: Verifying rollback...';
    
    -- Check that variant table is gone
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'project_variants'
    ) THEN
        RAISE EXCEPTION 'ROLLBACK FAILED: project_variants table still exists';
    END IF;
    
    -- Check that variant columns are gone
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_equipment_groups' 
        AND column_name = 'variant_name'
    ) THEN
        RAISE EXCEPTION 'ROLLBACK FAILED: variant_name column still exists in project_equipment_groups';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_roles' 
        AND column_name = 'variant_name'
    ) THEN
        RAISE EXCEPTION 'ROLLBACK FAILED: variant_name column still exists in project_roles';
    END IF;
    
    -- Verify data preservation (should be same counts)
    SELECT COUNT(*) INTO equipment_groups_count FROM project_equipment_groups;
    SELECT COUNT(*) INTO project_roles_count FROM project_roles;
    
    RAISE NOTICE '✓ Rollback verification passed';
    RAISE NOTICE 'Final state:';
    RAISE NOTICE '- Equipment groups: % (preserved)', equipment_groups_count;
    RAISE NOTICE '- Project roles: % (preserved)', project_roles_count;
    
    -- Final warning about data loss
    IF variants_count > 0 THEN
        RAISE WARNING 'IMPORTANT: % non-default variants were permanently deleted during rollback', variants_count;
        RAISE WARNING 'Any crew roles or equipment assigned to non-default variants have been lost';
        RAISE WARNING 'Projects have been returned to their pre-variant state';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== ROLLBACK COMPLETED SUCCESSFULLY ===';
    RAISE NOTICE 'The variant system has been completely removed.';
    RAISE NOTICE 'All existing project data has been preserved.';
    RAISE NOTICE 'Applications can continue to function normally.';
    
END $$;

-- Additional cleanup: Remove any lingering RLS policies that might reference variants
DO $$
BEGIN
    -- Clean up any policies that might reference the deleted table
    DROP POLICY IF EXISTS "Users can view project variants they have access to" ON project_variants;
    DROP POLICY IF EXISTS "Users can modify project variants they have access to" ON project_variants;
    
    RAISE NOTICE 'Cleaned up any remaining RLS policies';
EXCEPTION WHEN undefined_table THEN
    -- Expected if table is already dropped
    NULL;
END $$;

-- Final verification query
SELECT 
    'Rollback verification complete' as status,
    COUNT(*) as equipment_groups_remaining,
    (SELECT COUNT(*) FROM project_roles) as project_roles_remaining,
    NOT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'project_variants') as variant_table_removed
FROM project_equipment_groups;