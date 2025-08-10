-- ============================================================================
-- EMERGENCY FIX V7: Remove conflicting foreign key constraints
-- 
-- ISSUE: Two conflicting constraints on project_event_roles.role_id:
-- 1. project_event_roles_role_id_fkey → crew_roles.id (CORRECT)
-- 2. project_event_roles_project_role_id_fkey → project_roles.id (WRONG)
--
-- The second constraint expects role_id to reference project_roles.id
-- but we need it to reference crew_roles.id for business logic
-- ============================================================================

DO $$
BEGIN
    -- Check and remove the conflicting constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'project_event_roles_project_role_id_fkey'
        AND table_name = 'project_event_roles'
    ) THEN
        ALTER TABLE project_event_roles 
        DROP CONSTRAINT project_event_roles_project_role_id_fkey;
        
        RAISE NOTICE '✅ Removed conflicting constraint: project_event_roles_project_role_id_fkey';
    ELSE
        RAISE NOTICE 'ℹ️ Constraint project_event_roles_project_role_id_fkey does not exist';
    END IF;
    
    -- Verify the correct constraint exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'project_event_roles_role_id_fkey'
        AND table_name = 'project_event_roles'
    ) THEN
        RAISE NOTICE '✅ Correct constraint exists: project_event_roles_role_id_fkey → crew_roles.id';
    ELSE
        -- Add the correct constraint if it doesn't exist
        ALTER TABLE project_event_roles
        ADD CONSTRAINT project_event_roles_role_id_fkey 
        FOREIGN KEY (role_id) REFERENCES crew_roles(id);
        
        RAISE NOTICE '✅ Added correct constraint: project_event_roles_role_id_fkey → crew_roles.id';
    END IF;
    
    -- Final verification
    RAISE NOTICE '🎯 CONSTRAINT RESOLUTION COMPLETE';
    RAISE NOTICE 'project_event_roles.role_id now correctly references crew_roles.id';
    RAISE NOTICE 'This allows sync function to insert crew_roles.id values';
    
END $$;
