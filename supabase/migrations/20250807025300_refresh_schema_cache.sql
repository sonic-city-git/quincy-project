-- Migration: Refresh schema cache after adding foreign key relationships
-- Description: Forces Supabase to refresh its schema cache to recognize new relationships
-- Author: Claude
-- Date: 2025-08-07

-- Disable statement timeout for large operations
SET statement_timeout = 0;

-- Enable transaction mode
BEGIN;

-- Save current settings
DO $$
BEGIN
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_settings (
        setting_name text PRIMARY KEY,
        setting_value text
    );
    
    -- Store current schema settings
    INSERT INTO temp_settings (setting_name, setting_value)
    VALUES 
        ('search_path', current_setting('search_path')),
        ('role', current_setting('role'));
END $$;

-- Main migration logic
DO $$
BEGIN
    -- First verify the foreign key exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu 
            ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'project_event_roles'
        AND ccu.table_name = 'project_roles'
    ) THEN
        RAISE EXCEPTION 'Required foreign key relationship not found. Run previous migration first.';
    END IF;

    -- Refresh GraphQL schema
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'refresh_schema' AND pronamespace = 'graphql'::regnamespace) THEN
        PERFORM graphql.refresh_schema();
        RAISE NOTICE 'GraphQL schema refreshed';
    END IF;

    -- Refresh PostgREST schema cache
    NOTIFY pgrst, 'reload schema';
    RAISE NOTICE 'PostgREST schema cache refresh triggered';
END $$;

-- Verify changes
DO $$
BEGIN
    -- Verify the relationship exists in information_schema
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu 
            ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'project_event_roles'
        AND ccu.table_name = 'project_roles'
    ) THEN
        RAISE EXCEPTION 'Foreign key relationship verification failed';
    END IF;
END $$;

-- Restore original settings
DO $$
BEGIN
    -- Restore settings from temp table
    EXECUTE 'SET search_path TO ' || quote_literal((SELECT setting_value FROM temp_settings WHERE setting_name = 'search_path'));
    EXECUTE 'SET role ' || quote_literal((SELECT setting_value FROM temp_settings WHERE setting_name = 'role'));
    
    DROP TABLE IF EXISTS temp_settings;
END $$;

COMMIT;

-- Rollback function
SET search_path TO public;
CREATE OR REPLACE FUNCTION public.rollback_20250807025300()
RETURNS void AS $$
BEGIN
    -- Refresh schema caches again to ensure clean state
    PERFORM graphql.refresh_schema();
    NOTIFY pgrst, 'reload schema';
END;
$$ LANGUAGE plpgsql;