-- Migration: Copy default variant resources to new variants
-- When users create new variants, they expect their existing equipment as a starting point

-- Function to copy default variant equipment to a new variant
CREATE OR REPLACE FUNCTION copy_default_variant_to_new_variant(
  p_project_id uuid,
  p_new_variant_name text
)
RETURNS void AS $$
BEGIN
  -- Copy equipment groups from default to new variant
  INSERT INTO project_equipment_groups (
    project_id, 
    name, 
    variant_name,
    sort_order, 
    total_price,
    created_at,
    updated_at
  )
  SELECT 
    p_project_id,
    name,
    p_new_variant_name,
    sort_order,
    total_price,
    NOW(),
    NOW()
  FROM project_equipment_groups
  WHERE project_id = p_project_id 
    AND variant_name = 'default'
    AND NOT EXISTS (
      SELECT 1 FROM project_equipment_groups peg2 
      WHERE peg2.project_id = p_project_id 
        AND peg2.variant_name = p_new_variant_name
        AND peg2.name = project_equipment_groups.name
    );

  -- Copy equipment items from default to new variant  
  INSERT INTO project_equipment (
    project_id,
    equipment_id,
    variant_name,
    quantity,
    group_id,
    notes,
    created_at,
    updated_at
  )
  SELECT 
    pe.project_id,
    pe.equipment_id,
    p_new_variant_name,
    pe.quantity,
    -- Map to the new group in the new variant (by name)
    COALESCE(
      (SELECT peg_new.id 
       FROM project_equipment_groups peg_new 
       JOIN project_equipment_groups peg_old ON peg_old.id = pe.group_id
       WHERE peg_new.project_id = p_project_id 
         AND peg_new.variant_name = p_new_variant_name
         AND peg_new.name = peg_old.name),
      pe.group_id -- fallback to original group_id if mapping fails
    ),
    pe.notes,
    NOW(),
    NOW()
  FROM project_equipment pe
  WHERE pe.project_id = p_project_id 
    AND pe.variant_name = 'default'
    AND NOT EXISTS (
      SELECT 1 FROM project_equipment pe2 
      WHERE pe2.project_id = p_project_id 
        AND pe2.variant_name = p_new_variant_name
        AND pe2.equipment_id = pe.equipment_id
    );

  -- Copy crew roles from default to new variant
  INSERT INTO project_roles (
    project_id,
    role_id,
    variant_name,
    daily_rate,
    hourly_rate,
    hourly_category,
    preferred_id,
    created_at,
    updated_at
  )
  SELECT 
    p_project_id,
    role_id,
    p_new_variant_name,
    daily_rate,
    hourly_rate,
    hourly_category,
    preferred_id,
    NOW(),
    NOW()
  FROM project_roles
  WHERE project_id = p_project_id 
    AND variant_name = 'default'
    AND NOT EXISTS (
      SELECT 1 FROM project_roles pr2 
      WHERE pr2.project_id = p_project_id 
        AND pr2.variant_name = p_new_variant_name
        AND pr2.role_id = project_roles.role_id
    );

  RAISE NOTICE 'Copied default variant resources to variant: %', p_new_variant_name;
END;
$$ LANGUAGE plpgsql;

-- Copy default variant to existing non-default variants that are empty
-- This helps users who already created variants but have empty equipment
DO $$
DECLARE
    variant_record RECORD;
BEGIN
    FOR variant_record IN 
        SELECT DISTINCT pv.project_id, pv.variant_name
        FROM project_variants pv
        WHERE pv.variant_name != 'default'
          AND NOT EXISTS (
            SELECT 1 FROM project_equipment pe 
            WHERE pe.project_id = pv.project_id 
              AND pe.variant_name = pv.variant_name
          )
          AND EXISTS (
            SELECT 1 FROM project_equipment pe_default
            WHERE pe_default.project_id = pv.project_id 
              AND pe_default.variant_name = 'default'
          )
    LOOP
        PERFORM copy_default_variant_to_new_variant(
            variant_record.project_id, 
            variant_record.variant_name
        );
    END LOOP;
END $$;