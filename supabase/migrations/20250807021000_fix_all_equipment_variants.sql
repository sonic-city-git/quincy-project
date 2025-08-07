-- EMERGENCY FIX: Sync all existing project equipment to proper variants
-- Run this directly in Supabase SQL Editor to fix ALL projects immediately

DO $$
DECLARE
    project_record RECORD;
    equipment_count INTEGER;
    variant_count INTEGER;
    target_variant_name TEXT;
    projects_fixed INTEGER := 0;
    total_equipment_fixed INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting emergency fix for all project equipment variants...';
    
    -- Process each project that has equipment
    FOR project_record IN 
        SELECT DISTINCT p.id as project_id, p.title as project_title
        FROM projects p
        WHERE EXISTS (
            SELECT 1 FROM project_equipment pe 
            WHERE pe.project_id = p.id
        )
    LOOP
        -- Count equipment and variants for this project
        SELECT COUNT(*) INTO equipment_count FROM project_equipment WHERE project_id = project_record.project_id;
        SELECT COUNT(*) INTO variant_count FROM project_variants WHERE project_id = project_record.project_id;
        
        RAISE NOTICE 'Fixing project: "%" (%) - Equipment: %, Variants: %', 
            project_record.project_title, project_record.project_id, equipment_count, variant_count;
        
        -- CASE 1: Project has equipment but NO variants
        IF variant_count = 0 THEN
            RAISE NOTICE '  → Creating "Default" variant for project with no variants';
            
            -- Create Default variant
            INSERT INTO project_variants (project_id, variant_name, description, sort_order, created_at, updated_at)
            VALUES (
                project_record.project_id,
                'Default',
                'Default configuration (auto-created)',
                0,
                NOW(),
                NOW()
            );
            
            target_variant_name := 'Default';
            
        -- CASE 2: Project has exactly one variant
        ELSIF variant_count = 1 THEN
            -- Use the single existing variant
            SELECT variant_name INTO target_variant_name
            FROM project_variants 
            WHERE project_id = project_record.project_id
            LIMIT 1;
            
            RAISE NOTICE '  → Using single existing variant: "%"', target_variant_name;
            
        -- CASE 3: Project has multiple variants  
        ELSE
            -- Use the first created variant
            SELECT variant_name INTO target_variant_name
            FROM project_variants 
            WHERE project_id = project_record.project_id
            ORDER BY created_at ASC, id ASC
            LIMIT 1;
            
            RAISE NOTICE '  → Using first created variant: "%" (of % total)', target_variant_name, variant_count;
        END IF;
        
        -- Update ALL equipment to use the target variant
        UPDATE project_equipment 
        SET variant_name = target_variant_name
        WHERE project_id = project_record.project_id;
        
        -- Update ALL equipment groups
        UPDATE project_equipment_groups 
        SET variant_name = target_variant_name
        WHERE project_id = project_record.project_id;
        
        -- Update ALL crew roles
        UPDATE project_roles 
        SET variant_name = target_variant_name
        WHERE project_id = project_record.project_id;
        
        projects_fixed := projects_fixed + 1;
        total_equipment_fixed := total_equipment_fixed + equipment_count;
        
        RAISE NOTICE '  ✅ Fixed % equipment items for project "%"', equipment_count, project_record.project_title;
    END LOOP;
    
    -- Verification: Check for remaining orphaned equipment
    SELECT COUNT(*) INTO equipment_count
    FROM project_equipment pe
    WHERE NOT EXISTS (
        SELECT 1 FROM project_variants pv 
        WHERE pv.project_id = pe.project_id 
        AND pv.variant_name = pe.variant_name
    );
    
    -- Final results
    IF equipment_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Still have % orphaned equipment items!', equipment_count;
        
        -- Show which equipment is still orphaned
        RAISE NOTICE 'Orphaned equipment details:';
        FOR project_record IN
            SELECT pe.project_id, pe.variant_name, COUNT(*) as count
            FROM project_equipment pe
            WHERE NOT EXISTS (
                SELECT 1 FROM project_variants pv 
                WHERE pv.project_id = pe.project_id 
                AND pv.variant_name = pe.variant_name
            )
            GROUP BY pe.project_id, pe.variant_name
        LOOP
            RAISE NOTICE '  Project %, variant "%": % items', 
                project_record.project_id, project_record.project_title, project_record.equipment_count;
        END LOOP;
    ELSE
        RAISE NOTICE '🎉 SUCCESS: All equipment properly linked to variants!';
    END IF;
    
    RAISE NOTICE '📊 SUMMARY: Fixed % projects, % total equipment items', projects_fixed, total_equipment_fixed;
    
END $$;