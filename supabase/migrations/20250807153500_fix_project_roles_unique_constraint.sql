-- Migration: Fix project_roles unique constraint to allow multiple roles per variant
-- This fixes the constraint that prevents multiple instances of the same role type
-- The old constraint prevented multiple Camera Operators, multiple Sound Engineers, etc.
-- Now we allow unlimited instances of any role type per variant

-- Drop the old unique constraint that prevents multiple instances of the same role
ALTER TABLE project_roles 
DROP CONSTRAINT IF EXISTS unique_project_role;

-- We intentionally do NOT create a replacement unique constraint because:
-- 1. Users should be able to book multiple Camera Operators in the same variant
-- 2. Users should be able to book multiple Sound Engineers in the same variant  
-- 3. The only real constraint needed is the primary key on 'id'
-- 4. Foreign key constraints already ensure data integrity

-- Verify the change
DO $$
BEGIN
    -- Check that the old constraint is gone
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'project_roles' 
        AND constraint_name = 'unique_project_role'
    ) THEN
        RAISE WARNING 'Old unique_project_role constraint still exists';
    ELSE
        RAISE NOTICE '✅ Old unique_project_role constraint successfully removed';
    END IF;
    
    RAISE NOTICE '✅ Multiple instances of the same role type are now allowed per variant';
    RAISE NOTICE 'Users can now book multiple Camera Operators, Sound Engineers, etc. in the same variant';
END $$;