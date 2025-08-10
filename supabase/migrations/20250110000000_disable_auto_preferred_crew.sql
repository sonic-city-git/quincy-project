-- Disable automatic preferred crew assignment when creating events
-- Events should create role slots but NOT automatically assign preferred crew
-- Users can manually assign crew through the crew assignment dialog

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
  
  -- ✅ MODIFIED: Create role slots WITHOUT automatically assigning preferred crew
  INSERT INTO project_event_roles (
    project_id,
    event_id, 
    role_id,
    crew_member_id,  -- ✅ CHANGED: Always NULL - no automatic assignment
    notes,
    is_synced,
    created_at,
    updated_at
  )
  SELECT DISTINCT ON (pr.role_id)
    p_project_id,
    p_event_id,
    pr.role_id,
    NULL,            -- ✅ CHANGED: No automatic preferred crew assignment
    pr.notes,
    false,           -- ✅ CHANGED: Mark as not synced since no crew assigned
    NOW(),
    NOW()
  FROM project_roles pr
  WHERE pr.project_id = p_project_id
    AND pr.variant_id = v_actual_variant_id
  ORDER BY pr.role_id, pr.updated_at DESC;
  
  -- Update the event's crew_price based on variant rates (not assignments)
  -- This shows the expected cost even if no crew is assigned yet
  UPDATE project_events 
  SET 
    crew_price = COALESCE((
      SELECT SUM(COALESCE(pr.daily_rate, 0) * v_crew_rate_multiplier)
      FROM project_roles pr 
      WHERE pr.project_id = p_project_id
        AND pr.variant_id = v_actual_variant_id
    ), 0),
    total_price = COALESCE(equipment_price, 0) + COALESCE((
      SELECT SUM(COALESCE(pr.daily_rate, 0) * v_crew_rate_multiplier)
      FROM project_roles pr 
      WHERE pr.project_id = p_project_id
        AND pr.variant_id = v_actual_variant_id
    ), 0),
    updated_at = NOW()
  WHERE id = p_event_id;
  
END;
$$ LANGUAGE plpgsql;

-- Add helpful comment
COMMENT ON FUNCTION sync_event_crew IS 'Creates unfilled role slots for events without automatically assigning preferred crew. Users must manually assign crew through the UI.';
