-- Migration: Fix sync functions to properly use variant_id columns
-- CRITICAL: The sync functions must use variant_id columns, not variant_name columns
-- This replaces the broken functions that reference non-existent variant_name columns

-- ============================================================================
-- EQUIPMENT SYNC FUNCTION - VARIANT_ID BASED
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_event_equipment_unified(
  p_event_id uuid, 
  p_project_id uuid,
  p_variant_name text DEFAULT 'default'
)
RETURNS void AS $$
DECLARE
  v_event_type_multiplier DECIMAL := 1.0;
  v_variant_id uuid;
BEGIN
  -- Get variant_id from variant_name (required for database queries)
  SELECT id INTO v_variant_id
  FROM project_variants 
  WHERE project_id = p_project_id AND variant_name = p_variant_name;
  
  -- Fallback to default variant if specified variant not found
  IF v_variant_id IS NULL THEN
    SELECT id INTO v_variant_id
    FROM project_variants 
    WHERE project_id = p_project_id AND is_default = true
    LIMIT 1;
  END IF;
  
  -- If still no variant found, create default
  IF v_variant_id IS NULL THEN
    INSERT INTO project_variants (project_id, variant_name, is_default, sort_order)
    VALUES (p_project_id, 'default', true, 0)
    RETURNING id INTO v_variant_id;
  END IF;

  -- Get event type multiplier
  SELECT COALESCE(et.equipment_rate_multiplier, 1.0) INTO v_event_type_multiplier
  FROM project_events pe
  JOIN event_types et ON pe.event_type_id = et.id
  WHERE pe.id = p_event_id;
  
  -- Clean slate: delete existing event equipment
  DELETE FROM project_event_equipment WHERE event_id = p_event_id;
  
  -- Sync equipment using variant_id (NOT variant_name)
  INSERT INTO project_event_equipment (
    project_id, event_id, equipment_id, quantity, group_id, notes, is_synced, created_at, updated_at
  )
  SELECT DISTINCT ON (pe.equipment_id)
    p_project_id, p_event_id, pe.equipment_id, pe.quantity, pe.group_id, pe.notes, true, NOW(), NOW()
  FROM project_equipment pe
  WHERE pe.project_id = p_project_id 
    AND pe.variant_id = v_variant_id  -- CRITICAL: Use variant_id column
  ORDER BY pe.equipment_id, pe.updated_at DESC;
  
  -- Update event equipment pricing
  UPDATE project_events 
  SET equipment_price = COALESCE((
    SELECT SUM(COALESCE(e.rental_price, 0) * COALESCE(pee.quantity, 0) * v_event_type_multiplier)
    FROM project_event_equipment pee
    JOIN equipment e ON pee.equipment_id = e.id
    WHERE pee.event_id = p_event_id
  ), 0), updated_at = NOW()
  WHERE id = p_event_id;
  
  -- Update total pricing
  UPDATE project_events 
  SET total_price = COALESCE(equipment_price, 0) + COALESCE(crew_price, 0), updated_at = NOW()
  WHERE id = p_event_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'sync_event_equipment_unified error for variant %: %', p_variant_name, SQLERRM;
    -- Don't re-raise to prevent event creation from failing
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREW SYNC FUNCTION - VARIANT_ID BASED  
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_event_crew(
  p_event_id uuid, 
  p_project_id uuid,
  p_variant_name text DEFAULT 'default'
)
RETURNS void AS $$
DECLARE
  v_crew_rate_multiplier DECIMAL := 1.0;
  v_variant_id uuid;
BEGIN
  -- Get variant_id from variant_name (required for database queries)
  SELECT id INTO v_variant_id
  FROM project_variants 
  WHERE project_id = p_project_id AND variant_name = p_variant_name;
  
  -- Fallback to default variant if specified variant not found
  IF v_variant_id IS NULL THEN
    SELECT id INTO v_variant_id
    FROM project_variants 
    WHERE project_id = p_project_id AND is_default = true
    LIMIT 1;
  END IF;
  
  -- If still no variant found, create default
  IF v_variant_id IS NULL THEN
    INSERT INTO project_variants (project_id, variant_name, is_default, sort_order)
    VALUES (p_project_id, 'default', true, 0)
    RETURNING id INTO v_variant_id;
  END IF;

  -- Get event type crew multiplier
  SELECT COALESCE(et.crew_rate_multiplier, 1.0) INTO v_crew_rate_multiplier
  FROM project_events pe
  JOIN event_types et ON pe.event_type_id = et.id
  WHERE pe.id = p_event_id;
  
  -- Clean slate: delete existing event crew
  DELETE FROM project_event_roles WHERE event_id = p_event_id;
  
  -- Sync crew using variant_id (NOT variant_name)
  INSERT INTO project_event_roles (
    project_id, event_id, role_id, crew_member_id, daily_rate, hourly_rate, hourly_category, is_synced, created_at, updated_at
  )
  SELECT DISTINCT ON (pr.role_id)
    p_project_id, p_event_id, pr.role_id, pr.preferred_id, pr.daily_rate, pr.hourly_rate, pr.hourly_category, true, NOW(), NOW()
  FROM project_roles pr
  WHERE pr.project_id = p_project_id
    AND pr.variant_id = v_variant_id  -- CRITICAL: Use variant_id column
  ORDER BY pr.role_id, pr.updated_at DESC;
  
  -- Update event crew pricing
  UPDATE project_events 
  SET crew_price = COALESCE((
    SELECT SUM(COALESCE(per.daily_rate, 0) * v_crew_rate_multiplier)
    FROM project_event_roles per
    WHERE per.event_id = p_event_id
  ), 0), updated_at = NOW()
  WHERE id = p_event_id;
  
  -- Update total pricing
  UPDATE project_events 
  SET total_price = COALESCE(equipment_price, 0) + COALESCE(crew_price, 0), updated_at = NOW()
  WHERE id = p_event_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'sync_event_crew error for variant %: %', p_variant_name, SQLERRM;
    -- Don't re-raise to prevent event creation from failing
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION sync_event_equipment_unified(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_event_crew(uuid, uuid, text) TO authenticated;