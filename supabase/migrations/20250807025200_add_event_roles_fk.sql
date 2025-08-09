-- Migration: Add foreign key constraint between project_event_roles and project_roles
-- Description: Adds proper referential integrity between event roles and project roles
-- Author: Claude
-- Date: 2025-08-07

-- Disable statement timeout to handle large datasets
SET statement_timeout = 0;

-- Enable transaction mode
BEGIN;

-- Save current settings
DO $$
BEGIN
    -- Store original settings in temporary table
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_settings (
        setting_name text PRIMARY KEY,
        setting_value text
    );
    
    INSERT INTO temp_settings (setting_name, setting_value)
    VALUES ('session_replication_role', current_setting('session_replication_role'))
    ON CONFLICT (setting_name) DO NOTHING;
    
    -- Disable triggers temporarily for better performance
    SET session_replication_role = 'replica';
END $$;

-- Function to handle orphaned records
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    -- Count orphaned records before deletion
    SELECT COUNT(*)
    INTO orphaned_count
    FROM project_event_roles per
    WHERE NOT EXISTS (
        SELECT 1
        FROM project_roles pr
        WHERE pr.id = per.role_id
    );

    -- Log the count if any found
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Found % orphaned records in project_event_roles', orphaned_count;
    END IF;

    -- Delete orphaned records
    DELETE FROM project_event_roles
    WHERE role_id NOT IN (
        SELECT id FROM project_roles
    );

    -- Log the cleanup
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Deleted % orphaned records from project_event_roles', orphaned_count;
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'project_event_roles_project_role_id_fkey'
        AND table_name = 'project_event_roles'
    ) THEN
        ALTER TABLE project_event_roles
        ADD CONSTRAINT project_event_roles_project_role_id_fkey
        FOREIGN KEY (role_id)
        REFERENCES project_roles(id)
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint project_event_roles_project_role_id_fkey';
    END IF;
END $$;

-- Add performance index if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE indexname = 'idx_project_event_roles_role_id'
    ) THEN
        CREATE INDEX idx_project_event_roles_role_id 
        ON project_event_roles(role_id);
        
        RAISE NOTICE 'Created index idx_project_event_roles_role_id';
    END IF;
END $$;

-- Restore original settings
DO $$
BEGIN
    -- Restore session_replication_role
    EXECUTE 'SET session_replication_role = ' || quote_literal(
        (SELECT setting_value FROM temp_settings WHERE setting_name = 'session_replication_role')
    );
    
    -- Clean up temporary table
    DROP TABLE IF EXISTS temp_settings;
END $$;

-- Verify the changes
DO $$
DECLARE
    constraint_exists BOOLEAN;
    index_exists BOOLEAN;
BEGIN
    -- Check constraint
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'project_event_roles_project_role_id_fkey'
        AND table_name = 'project_event_roles'
    ) INTO constraint_exists;

    -- Check index
    SELECT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE indexname = 'idx_project_event_roles_role_id'
    ) INTO index_exists;

    -- Raise error if anything is missing
    IF NOT constraint_exists THEN
        RAISE EXCEPTION 'Foreign key constraint was not created successfully';
    END IF;

    IF NOT index_exists THEN
        RAISE EXCEPTION 'Index was not created successfully';
    END IF;
END $$;

COMMIT;

-- Rollback function in case we need to revert
-- To use: SELECT rollback_20250807025200();
CREATE OR REPLACE FUNCTION rollback_20250807025200()
RETURNS void AS $$
BEGIN
    -- Drop the foreign key constraint if it exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'project_event_roles_project_role_id_fkey'
        AND table_name = 'project_event_roles'
    ) THEN
        ALTER TABLE project_event_roles
        DROP CONSTRAINT project_event_roles_project_role_id_fkey;
    END IF;

    -- Drop the index if it exists
    IF EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE indexname = 'idx_project_event_roles_role_id'
    ) THEN
        DROP INDEX idx_project_event_roles_role_id;
    END IF;
END;
$$ LANGUAGE plpgsql;
