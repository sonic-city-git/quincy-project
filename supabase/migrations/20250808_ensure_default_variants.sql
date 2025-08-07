-- Migration: Ensure all projects have a default variant
-- This creates missing default variants and sets up automatic creation for new projects

-- Create default variants for all existing projects that don't have one
-- Use a more defensive approach to handle existing variants
DO $$
BEGIN
    -- Insert default variants only for projects that don't have any variants at all
    INSERT INTO project_variants (project_id, variant_name, description, is_default, sort_order)
    SELECT 
        p.id as project_id,
        'default' as variant_name,
        'Default configuration for equipment and crew' as description,
        true as is_default,
        0 as sort_order
    FROM projects p
    WHERE NOT EXISTS (
        SELECT 1 FROM project_variants pv 
        WHERE pv.project_id = p.id
    );
    
    -- For projects that have variants but no default, set one variant as default
    UPDATE project_variants 
    SET is_default = true
    WHERE id IN (
        SELECT DISTINCT ON (pv.project_id) pv.id
        FROM project_variants pv
        WHERE pv.project_id IN (
            SELECT p.id 
            FROM projects p
            WHERE EXISTS (SELECT 1 FROM project_variants pv2 WHERE pv2.project_id = p.id)
            AND NOT EXISTS (SELECT 1 FROM project_variants pv3 WHERE pv3.project_id = p.id AND pv3.is_default = true)
        )
        ORDER BY pv.project_id, pv.sort_order, pv.created_at
    );

END $$;

-- Create a function to automatically create default variant for new projects
CREATE OR REPLACE FUNCTION create_default_variant_for_project()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default variant for the new project (ignore conflicts)
    INSERT INTO project_variants (project_id, variant_name, description, is_default, sort_order)
    VALUES (
        NEW.id,
        'default',
        'Default configuration for equipment and crew',
        true,
        0
    )
    ON CONFLICT (project_id, variant_name) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create default variants for new projects
DROP TRIGGER IF EXISTS trigger_create_default_variant ON projects;
CREATE TRIGGER trigger_create_default_variant
    AFTER INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION create_default_variant_for_project();

-- Verify that all projects now have a default variant
DO $$
DECLARE
    projects_without_default INTEGER;
    total_projects INTEGER;
    total_variants INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_projects FROM projects;
    SELECT COUNT(*) INTO total_variants FROM project_variants WHERE variant_name = 'default';
    
    SELECT COUNT(*) INTO projects_without_default
    FROM projects p
    WHERE NOT EXISTS (
        SELECT 1 FROM project_variants pv 
        WHERE pv.project_id = p.id AND pv.variant_name = 'default'
    );
    
    RAISE NOTICE 'Project variant status: % projects, % default variants, % missing defaults', 
        total_projects, total_variants, projects_without_default;
    
    IF projects_without_default > 0 THEN
        RAISE WARNING 'Found % projects without default variants, but migration continuing', projects_without_default;
    ELSE
        RAISE NOTICE 'All projects now have default variants. Auto-creation trigger installed for new projects.';
    END IF;
END $$;