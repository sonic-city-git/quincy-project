-- Diagnostic migration to check Band variant data integrity
-- Simplified version using simple notices

DO $$
DECLARE
    v_variant_count integer;
    v_role_count integer;
    v_orphaned_count integer;
BEGIN
    RAISE NOTICE '=== BAND VARIANT DIAGNOSTIC START ===';
    
    -- 1. Check if Band variant exists
    SELECT COUNT(*) INTO v_variant_count
    FROM project_variants pv 
    WHERE pv.project_id = 'c84a77de-088a-422c-a9d7-bd1cf04b3d0b' 
      AND pv.variant_name = 'Band';
    
    IF v_variant_count > 0 THEN
        RAISE NOTICE '✅ Band variant exists';
    ELSE
        RAISE NOTICE '❌ Band variant does NOT exist';
        RETURN;
    END IF;
    
    -- 2. Count project_roles for Band variant
    SELECT COUNT(*) INTO v_role_count
    FROM project_variants pv
    JOIN project_roles pr ON pr.variant_id = pv.id
    WHERE pv.project_id = 'c84a77de-088a-422c-a9d7-bd1cf04b3d0b'
      AND pv.variant_name = 'Band';
    
    RAISE NOTICE '📊 Band variant has % roles', v_role_count;
    
    -- 3. Check for orphaned role_ids
    SELECT COUNT(*) INTO v_orphaned_count
    FROM project_variants pv
    JOIN project_roles pr ON pr.variant_id = pv.id
    WHERE pv.project_id = 'c84a77de-088a-422c-a9d7-bd1cf04b3d0b'
      AND pv.variant_name = 'Band'
      AND pr.role_id NOT IN (SELECT id FROM crew_roles);
      
    RAISE NOTICE '🚨 Orphaned role_ids: %', v_orphaned_count;
    
    -- If there are orphaned roles, they need to be fixed
    IF v_orphaned_count > 0 THEN
        RAISE NOTICE '🔧 Need to fix orphaned roles before sync can work';
    ELSE
        RAISE NOTICE '✅ All role_ids are valid';
    END IF;
    
    RAISE NOTICE '=== BAND VARIANT DIAGNOSTIC END ===';
END $$;
