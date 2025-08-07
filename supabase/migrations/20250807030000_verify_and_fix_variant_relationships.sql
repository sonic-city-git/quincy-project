-- Migration: Verify and Fix Variant Relationships
-- This migration ensures variant_id columns exist and are properly populated

DO $$
BEGIN
    -- Check if variant_id column exists in project_events
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_events' AND column_name = 'variant_id'
    ) THEN
        RAISE NOTICE 'Adding variant_id column to project_events';
        ALTER TABLE project_events ADD COLUMN variant_id UUID;
    ELSE
        RAISE NOTICE '✅ variant_id column already exists in project_events';
    END IF;

    -- Check if variant_id column exists in project_equipment
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_equipment' AND column_name = 'variant_id'
    ) THEN
        RAISE NOTICE 'Adding variant_id column to project_equipment';
        ALTER TABLE project_equipment ADD COLUMN variant_id UUID;
    ELSE
        RAISE NOTICE '✅ variant_id column already exists in project_equipment';
    END IF;

    -- Check if variant_id column exists in project_roles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_roles' AND column_name = 'variant_id'
    ) THEN
        RAISE NOTICE 'Adding variant_id column to project_roles';
        ALTER TABLE project_roles ADD COLUMN variant_id UUID;
    ELSE
        RAISE NOTICE '✅ variant_id column already exists in project_roles';
    END IF;

    -- Check if variant_id column exists in project_equipment_groups
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_equipment_groups' AND column_name = 'variant_id'
    ) THEN
        RAISE NOTICE 'Adding variant_id column to project_equipment_groups';
        ALTER TABLE project_equipment_groups ADD COLUMN variant_id UUID;
    ELSE
        RAISE NOTICE '✅ variant_id column already exists in project_equipment_groups';
    END IF;
END $$;

-- Populate variant_id from variant_name lookups where not already populated
DO $$
DECLARE
    events_updated INTEGER := 0;
    equipment_updated INTEGER := 0;
    roles_updated INTEGER := 0;
    groups_updated INTEGER := 0;
BEGIN
    -- Update project_events
    UPDATE project_events pe
    SET variant_id = pv.id
    FROM project_variants pv 
    WHERE pe.project_id = pv.project_id 
      AND pe.variant_name = pv.variant_name
      AND pe.variant_id IS NULL;
    
    GET DIAGNOSTICS events_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % project_events with variant_id', events_updated;

    -- Update project_equipment  
    UPDATE project_equipment pe
    SET variant_id = pv.id
    FROM project_variants pv
    WHERE pe.project_id = pv.project_id
      AND pe.variant_name = pv.variant_name  
      AND pe.variant_id IS NULL;
    
    GET DIAGNOSTICS equipment_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % project_equipment with variant_id', equipment_updated;

    -- Update project_roles
    UPDATE project_roles pr
    SET variant_id = pv.id  
    FROM project_variants pv
    WHERE pr.project_id = pv.project_id
      AND pr.variant_name = pv.variant_name
      AND pr.variant_id IS NULL;
    
    GET DIAGNOSTICS roles_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % project_roles with variant_id', roles_updated;

    -- Update project_equipment_groups
    UPDATE project_equipment_groups peg
    SET variant_id = pv.id
    FROM project_variants pv 
    WHERE peg.project_id = pv.project_id
      AND peg.variant_name = pv.variant_name
      AND peg.variant_id IS NULL;
    
    GET DIAGNOSTICS groups_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % project_equipment_groups with variant_id', groups_updated;
END $$;

-- Handle orphaned records by linking to default variant
DO $$
DECLARE
    orphaned_events INTEGER := 0;
    orphaned_equipment INTEGER := 0;
    orphaned_roles INTEGER := 0;
    orphaned_groups INTEGER := 0;
BEGIN
    -- Fix orphaned events
    UPDATE project_events pe
    SET variant_id = pv.id
    FROM project_variants pv
    WHERE pe.project_id = pv.project_id
      AND pv.variant_name = 'default'
      AND pe.variant_id IS NULL;
    
    GET DIAGNOSTICS orphaned_events = ROW_COUNT;
    IF orphaned_events > 0 THEN
        RAISE NOTICE 'Linked % orphaned events to default variants', orphaned_events;
    END IF;

    -- Fix orphaned equipment
    UPDATE project_equipment pe
    SET variant_id = pv.id
    FROM project_variants pv
    WHERE pe.project_id = pv.project_id
      AND pv.variant_name = 'default' 
      AND pe.variant_id IS NULL;
    
    GET DIAGNOSTICS orphaned_equipment = ROW_COUNT;
    IF orphaned_equipment > 0 THEN
        RAISE NOTICE 'Linked % orphaned equipment to default variants', orphaned_equipment;
    END IF;

    -- Fix orphaned roles
    UPDATE project_roles pr
    SET variant_id = pv.id
    FROM project_variants pv
    WHERE pr.project_id = pv.project_id
      AND pv.variant_name = 'default'
      AND pr.variant_id IS NULL;
    
    GET DIAGNOSTICS orphaned_roles = ROW_COUNT;
    IF orphaned_roles > 0 THEN
        RAISE NOTICE 'Linked % orphaned roles to default variants', orphaned_roles;
    END IF;

    -- Fix orphaned equipment groups
    UPDATE project_equipment_groups peg
    SET variant_id = pv.id
    FROM project_variants pv
    WHERE peg.project_id = pv.project_id
      AND pv.variant_name = 'default'
      AND peg.variant_id IS NULL;
    
    GET DIAGNOSTICS orphaned_groups = ROW_COUNT;
    IF orphaned_groups > 0 THEN
        RAISE NOTICE 'Linked % orphaned groups to default variants', orphaned_groups;
    END IF;
END $$;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    -- Add FK constraint for project_events
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'project_events' 
        AND constraint_name = 'project_events_variant_id_fkey'
    ) THEN
        RAISE NOTICE 'Adding foreign key constraint to project_events.variant_id';
        ALTER TABLE project_events
        ADD CONSTRAINT project_events_variant_id_fkey 
        FOREIGN KEY (variant_id) REFERENCES project_variants(id) ON DELETE CASCADE;
    ELSE
        RAISE NOTICE '✅ Foreign key constraint already exists for project_events.variant_id';
    END IF;

    -- Add FK constraint for project_equipment
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'project_equipment' 
        AND constraint_name = 'project_equipment_variant_id_fkey'
    ) THEN
        RAISE NOTICE 'Adding foreign key constraint to project_equipment.variant_id';
        ALTER TABLE project_equipment
        ADD CONSTRAINT project_equipment_variant_id_fkey
        FOREIGN KEY (variant_id) REFERENCES project_variants(id) ON DELETE CASCADE;
    ELSE
        RAISE NOTICE '✅ Foreign key constraint already exists for project_equipment.variant_id';
    END IF;

    -- Add FK constraint for project_roles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'project_roles' 
        AND constraint_name = 'project_roles_variant_id_fkey'
    ) THEN
        RAISE NOTICE 'Adding foreign key constraint to project_roles.variant_id';
        ALTER TABLE project_roles  
        ADD CONSTRAINT project_roles_variant_id_fkey
        FOREIGN KEY (variant_id) REFERENCES project_variants(id) ON DELETE CASCADE;
    ELSE
        RAISE NOTICE '✅ Foreign key constraint already exists for project_roles.variant_id';
    END IF;

    -- Add FK constraint for project_equipment_groups
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'project_equipment_groups' 
        AND constraint_name = 'project_equipment_groups_variant_id_fkey'
    ) THEN
        RAISE NOTICE 'Adding foreign key constraint to project_equipment_groups.variant_id';
        ALTER TABLE project_equipment_groups
        ADD CONSTRAINT project_equipment_groups_variant_id_fkey
        FOREIGN KEY (variant_id) REFERENCES project_variants(id) ON DELETE CASCADE;
    ELSE
        RAISE NOTICE '✅ Foreign key constraint already exists for project_equipment_groups.variant_id';
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_events_variant_id 
ON project_events(project_id, variant_id);

CREATE INDEX IF NOT EXISTS idx_project_equipment_variant_id
ON project_equipment(project_id, variant_id);

CREATE INDEX IF NOT EXISTS idx_project_roles_variant_id
ON project_roles(project_id, variant_id);

CREATE INDEX IF NOT EXISTS idx_project_equipment_groups_variant_id
ON project_equipment_groups(project_id, variant_id);

-- Final verification
DO $$
DECLARE
    events_without_variant INTEGER;
    equipment_without_variant INTEGER;
    roles_without_variant INTEGER;
    groups_without_variant INTEGER;
BEGIN
    -- Count records without variant_id
    SELECT COUNT(*) INTO events_without_variant
    FROM project_events WHERE variant_id IS NULL;
    
    SELECT COUNT(*) INTO equipment_without_variant  
    FROM project_equipment WHERE variant_id IS NULL;
    
    SELECT COUNT(*) INTO roles_without_variant
    FROM project_roles WHERE variant_id IS NULL;
    
    SELECT COUNT(*) INTO groups_without_variant
    FROM project_equipment_groups WHERE variant_id IS NULL;
    
    -- Report results
    RAISE NOTICE '=== VARIANT RELATIONSHIP MIGRATION COMPLETE ===';
    RAISE NOTICE 'Records without variant_id:';
    RAISE NOTICE '  Events: %', events_without_variant;
    RAISE NOTICE '  Equipment: %', equipment_without_variant; 
    RAISE NOTICE '  Roles: %', roles_without_variant;
    RAISE NOTICE '  Groups: %', groups_without_variant;
    
    IF events_without_variant = 0 AND equipment_without_variant = 0 AND 
       roles_without_variant = 0 AND groups_without_variant = 0 THEN
        RAISE NOTICE '✅ SUCCESS: All records have proper variant_id relationships!';
    ELSE
        RAISE WARNING '⚠️  Some records still missing variant_id. Manual cleanup may be needed.';
    END IF;
END $$;