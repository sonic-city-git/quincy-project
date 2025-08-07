-- Migration: Validate variant system data integrity
-- This migration performs comprehensive validation of the variant system

DO $$
DECLARE
    test_result RECORD;
    error_count INTEGER := 0;
    warning_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting variant system validation...';
    
    -- Test 1: Verify variant columns exist and have correct defaults
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'project_equipment_groups' 
            AND column_name = 'variant_name'
            AND column_default = '''default''::text'
        ) THEN
            RAISE EXCEPTION 'project_equipment_groups.variant_name column missing or has wrong default';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'project_roles' 
            AND column_name = 'variant_name'
            AND column_default = '''default''::text'
        ) THEN
            RAISE EXCEPTION 'project_roles.variant_name column missing or has wrong default';
        END IF;
        
        RAISE NOTICE '✓ Test 1 PASSED: Variant columns exist with correct defaults';
    EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE NOTICE '✗ Test 1 FAILED: %', SQLERRM;
    END;
    
    -- Test 2: Verify project_variants table exists with proper structure
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'project_variants'
        ) THEN
            RAISE EXCEPTION 'project_variants table does not exist';
        END IF;
        
        -- Check required columns
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'project_variants' 
            AND column_name IN ('id', 'project_id', 'variant_name', 'display_name', 'is_default', 'sort_order')
            GROUP BY table_name
            HAVING COUNT(*) = 6
        ) THEN
            RAISE EXCEPTION 'project_variants table missing required columns';
        END IF;
        
        RAISE NOTICE '✓ Test 2 PASSED: project_variants table structure correct';
    EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE NOTICE '✗ Test 2 FAILED: %', SQLERRM;
    END;
    
    -- Test 3: Verify all equipment groups have valid variant names
    BEGIN
        IF EXISTS (
            SELECT 1 FROM project_equipment_groups 
            WHERE variant_name IS NULL OR variant_name = '' OR variant_name !~ '^[a-z0-9_]+$'
        ) THEN
            RAISE EXCEPTION 'Found project_equipment_groups with invalid variant_name';
        END IF;
        
        RAISE NOTICE '✓ Test 3 PASSED: All equipment groups have valid variant names';
    EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE NOTICE '✗ Test 3 FAILED: %', SQLERRM;
    END;
    
    -- Test 4: Verify all project roles have valid variant names
    BEGIN
        IF EXISTS (
            SELECT 1 FROM project_roles 
            WHERE variant_name IS NULL OR variant_name = '' OR variant_name !~ '^[a-z0-9_]+$'
        ) THEN
            RAISE EXCEPTION 'Found project_roles with invalid variant_name';
        END IF;
        
        RAISE NOTICE '✓ Test 4 PASSED: All project roles have valid variant names';
    EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE NOTICE '✗ Test 4 FAILED: %', SQLERRM;
    END;
    
    -- Test 5: Verify all artist projects have default variants
    BEGIN
        FOR test_result IN
            SELECT p.id, p.name
            FROM projects p
            JOIN project_types pt ON p.project_type_id = pt.id
            WHERE pt.code = 'artist'
            AND NOT EXISTS (
                SELECT 1 FROM project_variants pv 
                WHERE pv.project_id = p.id AND pv.variant_name = 'default'
            )
        LOOP
            RAISE WARNING 'Artist project "%" (ID: %) missing default variant', test_result.name, test_result.id;
            warning_count := warning_count + 1;
        END LOOP;
        
        IF warning_count = 0 THEN
            RAISE NOTICE '✓ Test 5 PASSED: All artist projects have default variants';
        ELSE
            RAISE NOTICE '⚠ Test 5 WARNING: % artist projects missing default variants', warning_count;
        END IF;
    END;
    
    -- Test 6: Verify foreign key integrity
    BEGIN
        IF EXISTS (
            SELECT 1 FROM project_variants pv
            LEFT JOIN projects p ON pv.project_id = p.id
            WHERE p.id IS NULL
        ) THEN
            RAISE EXCEPTION 'Found orphaned project_variants records';
        END IF;
        
        RAISE NOTICE '✓ Test 6 PASSED: No orphaned variant records';
    EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE NOTICE '✗ Test 6 FAILED: %', SQLERRM;
    END;
    
    -- Test 7: Verify unique constraints
    BEGIN
        IF EXISTS (
            SELECT project_id, variant_name, COUNT(*)
            FROM project_variants
            GROUP BY project_id, variant_name
            HAVING COUNT(*) > 1
        ) THEN
            RAISE EXCEPTION 'Found duplicate project_variants (project_id, variant_name)';
        END IF;
        
        IF EXISTS (
            SELECT project_id, COUNT(*)
            FROM project_variants
            WHERE is_default = true
            GROUP BY project_id
            HAVING COUNT(*) > 1
        ) THEN
            RAISE EXCEPTION 'Found projects with multiple default variants';
        END IF;
        
        RAISE NOTICE '✓ Test 7 PASSED: Unique constraints working correctly';
    EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE NOTICE '✗ Test 7 FAILED: %', SQLERRM;
    END;
    
    -- Test 8: Verify indexes exist
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'idx_project_equipment_groups_variant'
        ) THEN
            RAISE EXCEPTION 'Missing index: idx_project_equipment_groups_variant';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'idx_project_roles_variant'
        ) THEN
            RAISE EXCEPTION 'Missing index: idx_project_roles_variant';
        END IF;
        
        RAISE NOTICE '✓ Test 8 PASSED: Required indexes exist';
    EXCEPTION WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE NOTICE '✗ Test 8 FAILED: %', SQLERRM;
    END;
    
    -- Final validation summary
    RAISE NOTICE '';
    RAISE NOTICE '=== VALIDATION SUMMARY ===';
    RAISE NOTICE 'Tests run: 8';
    RAISE NOTICE 'Errors: %', error_count;
    RAISE NOTICE 'Warnings: %', warning_count;
    
    IF error_count = 0 THEN
        RAISE NOTICE '✓ ALL CRITICAL TESTS PASSED - Variant system migration successful!';
    ELSE
        RAISE EXCEPTION 'VALIDATION FAILED: % critical errors found. Migration may be incomplete.', error_count;
    END IF;
    
    -- Display variant statistics
    RAISE NOTICE '';
    RAISE NOTICE '=== VARIANT STATISTICS ===';
    FOR test_result IN
        SELECT * FROM variant_statistics ORDER BY project_type
    LOOP
        RAISE NOTICE 'Project Type: % | Total Projects: % | With Variants: % | Total Variants: %', 
                    test_result.project_type, 
                    test_result.total_projects, 
                    test_result.projects_with_variants, 
                    test_result.total_variants;
    END LOOP;
    
END $$;