-- Migration: Sync all existing project equipment to proper variants
-- This fixes the data integrity issue where equipment has variant_name = 'default'
-- but projects don't have a matching variant

DO $$
DECLARE
    project_record RECORD;
    variant_record RECORD;
    equipment_count INTEGER;
    variant_count INTEGER;
    target_variant_name TEXT;
    projects_with_equipment INTEGER;
    total_equipment_items INTEGER;
    unique_variants_used INTEGER;
BEGIN
    -- Process each project that has equipment
    FOR project_record IN 
        SELECT DISTINCT p.id as project_id, p.title as project_title
        FROM projects p
        WHERE EXISTS (
            SELECT 1 FROM project_equipment pe 
            WHERE pe.project_id = p.id
        )
    LOOP
        -- Count equipment items for this project
        SELECT COUNT(*) INTO equipment_count
        FROM project_equipment 
        WHERE project_id = project_record.project_id;
        
        -- Count variants for this project
        SELECT COUNT(*) INTO variant_count
        FROM project_variants 
        WHERE project_id = project_record.project_id;
        
        RAISE NOTICE 'Processing project: % (ID: %) - Equipment: %, Variants: %', 
            project_record.project_title, project_record.project_id, equipment_count, variant_count;
        
        -- Case 1: Project has equipment but NO variants
        IF variant_count = 0 THEN
            RAISE NOTICE '  → Creating Default variant for project with no variants';
            
            -- Create a Default variant
            INSERT INTO project_variants (project_id, variant_name, description, sort_order)
            VALUES (
                project_record.project_id,
                'Default',
                'Default configuration (auto-created during migration)',
                0
            );
            
            -- Update all equipment to use this variant
            UPDATE project_equipment 
            SET variant_name = 'Default'
            WHERE project_id = project_record.project_id;
            
            -- Update equipment groups too
            UPDATE project_equipment_groups 
            SET variant_name = 'Default'
            WHERE project_id = project_record.project_id;
            
            -- Update crew roles too
            UPDATE project_roles 
            SET variant_name = 'Default'
            WHERE project_id = project_record.project_id;
            
        -- Case 2: Project has equipment and EXACTLY ONE variant
        ELSIF variant_count = 1 THEN
            -- Get the single variant name
            SELECT variant_name INTO target_variant_name
            FROM project_variants 
            WHERE project_id = project_record.project_id
            LIMIT 1;
            
            RAISE NOTICE '  → Assigning all equipment to single variant: %', target_variant_name;
            
            -- Update all equipment to use this variant
            UPDATE project_equipment 
            SET variant_name = target_variant_name
            WHERE project_id = project_record.project_id;
            
            -- Update equipment groups too
            UPDATE project_equipment_groups 
            SET variant_name = target_variant_name
            WHERE project_id = project_record.project_id;
            
            -- Update crew roles too
            UPDATE project_roles 
            SET variant_name = target_variant_name
            WHERE project_id = project_record.project_id;
            
        -- Case 3: Project has equipment and MULTIPLE variants
        ELSE
            -- Get the first variant (by creation order) as the target
            SELECT variant_name INTO target_variant_name
            FROM project_variants 
            WHERE project_id = project_record.project_id
            ORDER BY created_at ASC, id ASC
            LIMIT 1;
            
            RAISE NOTICE '  → Assigning all equipment to first variant: % (out of % variants)', 
                target_variant_name, variant_count;
            
            -- Update all equipment to use the first variant
            UPDATE project_equipment 
            SET variant_name = target_variant_name
            WHERE project_id = project_record.project_id;
            
            -- Update equipment groups too
            UPDATE project_equipment_groups 
            SET variant_name = target_variant_name
            WHERE project_id = project_record.project_id;
            
            -- Update crew roles too
            UPDATE project_roles 
            SET variant_name = target_variant_name
            WHERE project_id = project_record.project_id;
            
        END IF;
    END LOOP;
    
    -- Final verification: Check for orphaned equipment
    SELECT COUNT(*) INTO equipment_count
    FROM project_equipment pe
    WHERE NOT EXISTS (
        SELECT 1 FROM project_variants pv 
        WHERE pv.project_id = pe.project_id 
        AND pv.variant_name = pe.variant_name
    );
    
    IF equipment_count > 0 THEN
        RAISE WARNING 'Still have % orphaned equipment items after migration!', equipment_count;
    ELSE
        RAISE NOTICE 'SUCCESS: All equipment items are now properly linked to variants';
    END IF;
    
    -- Summary stats
    SELECT 
        COUNT(DISTINCT pe.project_id),
        COUNT(*),
        COUNT(DISTINCT pe.variant_name)
    INTO projects_with_equipment, total_equipment_items, unique_variants_used
    FROM project_equipment pe;
    
    RAISE NOTICE 'MIGRATION COMPLETE: % projects with equipment, % total items, % unique variants used', 
        projects_with_equipment, total_equipment_items, unique_variants_used;
        
END $$;