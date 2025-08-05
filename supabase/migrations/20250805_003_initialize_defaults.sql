-- Migration: Initialize default variants for existing artist projects
-- This migration creates default variants for all existing artist projects

DO $$
DECLARE
    artist_project_record RECORD;
    variant_count INTEGER;
    total_projects INTEGER := 0;
    processed_projects INTEGER := 0;
BEGIN
    -- Get count of artist projects for reporting
    SELECT COUNT(*) INTO total_projects
    FROM projects p
    JOIN project_types pt ON p.project_type_id = pt.id
    WHERE pt.code = 'artist';
    
    RAISE NOTICE 'Found % artist projects to process', total_projects;
    
    -- Process each artist project
    FOR artist_project_record IN
        SELECT p.id, p.name
        FROM projects p
        JOIN project_types pt ON p.project_type_id = pt.id
        WHERE pt.code = 'artist'
    LOOP
        -- Check if project already has variants
        SELECT COUNT(*) INTO variant_count
        FROM project_variants
        WHERE project_id = artist_project_record.id;
        
        -- Only create default variant if none exist
        IF variant_count = 0 THEN
            INSERT INTO project_variants (
                project_id,
                variant_name,
                display_name,
                description,
                is_default,
                sort_order
            ) VALUES (
                artist_project_record.id,
                'default',
                'Standard Setup',
                'Default equipment and crew configuration',
                true,
                0
            );
            
            processed_projects := processed_projects + 1;
            
            -- Log progress every 10 projects
            IF processed_projects % 10 = 0 THEN
                RAISE NOTICE 'Processed % of % artist projects', processed_projects, total_projects;
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Successfully created default variants for % artist projects', processed_projects;
    
    -- Verify the migration
    SELECT COUNT(*) INTO variant_count
    FROM project_variants pv
    JOIN projects p ON pv.project_id = p.id
    JOIN project_types pt ON p.project_type_id = pt.id
    WHERE pt.code = 'artist' AND pv.variant_name = 'default';
    
    IF variant_count != total_projects THEN
        RAISE WARNING 'Expected % default variants but found %. Some artist projects may not have default variants.', 
                     total_projects, variant_count;
    ELSE
        RAISE NOTICE 'Verification passed: All % artist projects have default variants', total_projects;
    END IF;
    
    -- Update existing project equipment groups and roles to reference default variant
    -- (they already have variant_name = 'default' from previous migration)
    
    -- Verify that all equipment groups for artist projects have proper variant references
    IF EXISTS (
        SELECT 1 
        FROM project_equipment_groups peg
        JOIN projects p ON peg.project_id = p.id
        JOIN project_types pt ON p.project_type_id = pt.id
        WHERE pt.code = 'artist' 
        AND peg.variant_name != 'default'
    ) THEN
        RAISE WARNING 'Found equipment groups for artist projects with variant_name != default';
    END IF;
    
    -- Verify that all project roles for artist projects have proper variant references
    IF EXISTS (
        SELECT 1 
        FROM project_roles pr
        JOIN projects p ON pr.project_id = p.id
        JOIN project_types pt ON p.project_type_id = pt.id
        WHERE pt.code = 'artist' 
        AND pr.variant_name != 'default'
    ) THEN
        RAISE WARNING 'Found project roles for artist projects with variant_name != default';
    END IF;
    
END $$;

-- Create a helpful view for variant statistics
CREATE OR REPLACE VIEW variant_statistics AS
SELECT 
    pt.name as project_type,
    COUNT(DISTINCT p.id) as total_projects,
    COUNT(DISTINCT pv.project_id) as projects_with_variants,
    COUNT(pv.id) as total_variants,
    COUNT(CASE WHEN pv.is_default THEN 1 END) as default_variants
FROM project_types pt
LEFT JOIN projects p ON p.project_type_id = pt.id
LEFT JOIN project_variants pv ON pv.project_id = p.id
GROUP BY pt.id, pt.name
ORDER BY pt.name;

COMMENT ON VIEW variant_statistics IS 'Summary statistics for project variants by project type';

-- Display current variant statistics
SELECT * FROM variant_statistics;

RAISE NOTICE 'Default variant initialization completed successfully.';