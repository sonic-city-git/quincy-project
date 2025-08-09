# Supabase Migration Guidelines

## Overview
This document outlines best practices and procedures for managing database migrations in our Supabase project. Following these guidelines ensures safe, reversible, and maintainable database changes.

## Migration File Structure

### Naming Convention
```sql
YYYYMMDDHHMMSS_descriptive_name.sql
```
Example: `20250807025200_add_event_roles_fk.sql`

- Use timestamp format to ensure unique ordering
- Use descriptive names that indicate the purpose
- Use lowercase and underscores
- Avoid generic names like "update_table" or "fix_bug"

### Template Structure
```sql
-- Migration: Brief title
-- Description: Detailed description of what this migration does
-- Author: Your name
-- Date: YYYY-MM-DD

-- Disable statement timeout for large operations
SET statement_timeout = 0;

-- Enable transaction mode
BEGIN;

-- Save current settings (if needed)
DO $$
BEGIN
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_settings (
        setting_name text PRIMARY KEY,
        setting_value text
    );
    
    -- Store settings you'll need to restore
    INSERT INTO temp_settings VALUES ('setting_name', current_setting('setting_name'));
END $$;

-- Main migration logic
DO $$
BEGIN
    -- Your migration code here
    -- Use IF EXISTS/IF NOT EXISTS for idempotency
    -- Include proper error handling
    -- Log important operations using RAISE NOTICE
END $$;

-- Verify changes
DO $$
BEGIN
    -- Verification queries
    -- RAISE EXCEPTION if verification fails
END $$;

-- Restore original settings
DO $$
BEGIN
    -- Restore from temp_settings
    DROP TABLE IF EXISTS temp_settings;
END $$;

COMMIT;

-- Rollback function (optional but recommended)
CREATE OR REPLACE FUNCTION rollback_YYYYMMDDHHMMSS()
RETURNS void AS $$
BEGIN
    -- Reverse the changes made in this migration
END;
$$ LANGUAGE plpgsql;
```

## Best Practices

### 1. Safety First
- Always wrap migrations in transactions
- Include rollback functions for complex changes
- Verify changes after applying them
- Handle orphaned records before adding constraints
- Use IF EXISTS/IF NOT EXISTS for idempotency

### 2. Performance
```sql
-- Disable triggers temporarily for bulk operations
SET session_replication_role = 'replica';

-- Remember to restore after operation
SET session_replication_role = 'origin';

-- Consider adding indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_table_column ON table(column);
```

### 3. Error Handling
```sql
DO $$
DECLARE
    error_count INTEGER;
BEGIN
    -- Count potential issues
    SELECT COUNT(*) INTO error_count
    FROM problematic_records;

    IF error_count > 0 THEN
        RAISE NOTICE 'Found % problematic records', error_count;
        -- Handle the issues
    END IF;
END $$;
```

### 4. Logging
```sql
RAISE NOTICE 'Starting migration step...';
RAISE NOTICE 'Processed % records', count;
RAISE NOTICE 'Migration step completed';
```

## Common Commands

### Managing Migrations
```bash
# List migrations
supabase migration list

# Create new migration
supabase migration new my_migration_name

# Push migrations
supabase db push

# Push including out-of-order migrations
supabase db push --include-all

# Fix migration history
supabase migration repair --status reverted YYYYMMDDHHMMSS
supabase migration repair --status applied YYYYMMDDHHMMSS
```

### Troubleshooting

#### Out of Order Migrations
If you see "Found local migration files to be inserted before the last migration":
1. Check migration timestamps
2. Use `--include-all` flag
3. If needed, repair migration history:
```bash
supabase migration repair --status reverted problematic_migration
```

#### Duplicate Migrations
1. Remove duplicate files
2. Repair migration history
3. Push changes with `--include-all`

#### Failed Migrations
1. Check error messages
2. Fix the issue in the migration file
3. Repair migration history if needed
4. Try pushing again

## Example: Adding Foreign Key Constraint

```sql
-- Migration: Add foreign key with cleanup
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    -- Check for orphaned records
    SELECT COUNT(*)
    INTO orphaned_count
    FROM child_table c
    WHERE NOT EXISTS (
        SELECT 1 FROM parent_table p
        WHERE p.id = c.parent_id
    );

    -- Log and clean up
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Found % orphaned records', orphaned_count;
        
        DELETE FROM child_table
        WHERE parent_id NOT IN (
            SELECT id FROM parent_table
        );
        
        RAISE NOTICE 'Deleted % orphaned records', orphaned_count;
    END IF;

    -- Add constraint
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_child_parent'
    ) THEN
        ALTER TABLE child_table
        ADD CONSTRAINT fk_child_parent
        FOREIGN KEY (parent_id)
        REFERENCES parent_table(id)
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint';
    END IF;
END $$;
```

## Testing Migrations

### Local Testing
1. Create a backup of your local database
2. Apply migration locally first
3. Test all affected functionality
4. Verify data integrity
5. Test rollback function if provided

### Production Deployment
1. Always backup production database first
2. Review migration list before pushing
3. Apply during low-traffic periods
4. Monitor logs for any warnings/errors
5. Verify application functionality after migration

## Additional Resources
- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli/usage#supabase-migration)
- [PostgreSQL Alter Table](https://www.postgresql.org/docs/current/sql-altertable.html)
- [PostgreSQL Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
