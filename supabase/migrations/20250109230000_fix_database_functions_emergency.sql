-- ============================================================================
-- EMERGENCY FIX: Database Functions Column Name and Foreign Key Issues
-- 
-- Fixes the equipment_price_multiplier → equipment_rate_multiplier issue
-- Fixes the project_event_roles foreign key constraint issue
-- ============================================================================

-- Fix sync_event_equipment_unified function to use correct column name
CREATE OR REPLACE FUNCTION sync_event_equipment_unified(
  p_event_id uuid, 
  p_project_id uuid,
  p_variant_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_event_type_multiplier DECIMAL;
  v_actual_variant_id uuid;
BEGIN
  -- If no variant_id provided, get it from the event
  IF p_variant_id IS NULL THEN
    SELECT variant_id INTO v_actual_variant_id
    FROM project_events 
    WHERE id = p_event_id;
    
    -- Fallback to default variant if event has no variant_id
    IF v_actual_variant_id IS NULL THEN
      SELECT id INTO v_actual_variant_id 
      FROM project_variants 
      WHERE project_id = p_project_id AND variant_name = 'default';
    END IF;
  ELSE
    v_actual_variant_id := p_variant_id;
  END IF;

  -- ✅ FIXED: Use equipment_rate_multiplier (not equipment_price_multiplier)
  SELECT COALESCE(et.equipment_rate_multiplier, 1.0) INTO v_event_type_multiplier
  FROM project_events pe
  JOIN event_types et ON pe.event_type_id = et.id
  WHERE pe.id = p_event_id;
  
  -- Delete ALL existing event equipment for this event (clean slate)
  DELETE FROM project_event_equipment 
  WHERE event_id = p_event_id;
  
  -- Insert project equipment for the specified variant
  INSERT INTO project_event_equipment (
    project_id,
    event_id,
    equipment_id,
    quantity,
    is_synced,
    created_at,
    updated_at
  )
  SELECT 
    p_project_id,
    p_event_id,
    pe.equipment_id,
    pe.quantity,
    true,
    NOW(),
    NOW()
  FROM project_equipment pe
  WHERE pe.project_id = p_project_id
    AND pe.variant_id = v_actual_variant_id;
  
  -- Update the event's equipment_price with calculated total
  UPDATE project_events 
  SET 
    equipment_price = COALESCE((
      SELECT SUM(
        COALESCE(e.rental_price, 0) * 
        COALESCE(pee.quantity, 0) * 
        v_event_type_multiplier
      )
      FROM project_event_equipment pee
      JOIN equipment e ON pee.equipment_id = e.id
      WHERE pee.event_id = p_event_id
    ), 0),
    updated_at = NOW()
  WHERE id = p_event_id;
  
  -- Update total_price
  UPDATE project_events 
  SET 
    total_price = COALESCE(equipment_price, 0) + COALESCE(crew_price, 0),
    updated_at = NOW()
  WHERE id = p_event_id;
  
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Fix sync_event_crew function for proper foreign key handling
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_event_crew(
  p_event_id uuid,
  p_project_id uuid, 
  p_variant_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_crew_rate_multiplier DECIMAL;
  v_actual_variant_id uuid;
  v_role_count integer;
BEGIN
  -- If no variant_id provided, get it from the event
  IF p_variant_id IS NULL THEN
    SELECT variant_id INTO v_actual_variant_id
    FROM project_events
    WHERE id = p_event_id;
    
    -- Fallback to default variant if event has no variant_id
    IF v_actual_variant_id IS NULL THEN
      SELECT id INTO v_actual_variant_id
      FROM project_variants
      WHERE project_id = p_project_id AND variant_name = 'default';
    END IF;
  ELSE
    v_actual_variant_id := p_variant_id;
  END IF;

  -- Check if variant has crew roles before attempting sync
  SELECT COUNT(*) INTO v_role_count
  FROM project_roles pr
  WHERE pr.project_id = p_project_id
    AND pr.variant_id = v_actual_variant_id;
    
  -- If no roles exist for this variant, skip crew sync gracefully
  IF v_role_count = 0 THEN
    -- Still update crew_price to 0
    UPDATE project_events 
    SET 
      crew_price = 0,
      total_price = COALESCE(equipment_price, 0),
      updated_at = NOW()
    WHERE id = p_event_id;
    RETURN;
  END IF;

  -- Get the event's crew rate multiplier
  SELECT COALESCE(et.crew_rate_multiplier, 1.0) INTO v_crew_rate_multiplier
  FROM project_events pe
  JOIN event_types et ON pe.event_type_id = et.id  
  WHERE pe.id = p_event_id;
  
  -- Delete existing crew assignments for this event
  DELETE FROM project_event_roles 
  WHERE event_id = p_event_id;
  
  -- ✅ FIXED: Insert with proper project_role_id foreign key
  INSERT INTO project_event_roles (
    project_id,
    event_id, 
    project_role_id,  -- Use project_role_id to reference project_roles.id
    crew_member_id,
    notes,
    is_synced,
    created_at,
    updated_at
  )
  SELECT DISTINCT ON (pr.id)
    p_project_id,
    p_event_id,
    pr.id,  -- Reference project_roles.id
    pr.preferred_id,
    pr.notes,
    true,
    NOW(),
    NOW()
  FROM project_roles pr
  WHERE pr.project_id = p_project_id
    AND pr.variant_id = v_actual_variant_id
  ORDER BY pr.id, pr.updated_at DESC;
  
  -- Update the event's crew_price
  UPDATE project_events 
  SET 
    crew_price = COALESCE((
      SELECT SUM(COALESCE(pr.daily_rate, 0) * v_crew_rate_multiplier)
      FROM project_roles pr 
      WHERE pr.project_id = p_project_id
        AND pr.variant_id = v_actual_variant_id
    ), 0),
    updated_at = NOW()
  WHERE id = p_event_id;
  
  -- Update total_price
  UPDATE project_events 
  SET 
    total_price = COALESCE(equipment_price, 0) + COALESCE(crew_price, 0),
    updated_at = NOW()
  WHERE id = p_event_id;
  
END;
$$ LANGUAGE plpgsql;
