-- ============================================================================
-- EMERGENCY FIX V5: Correct Foreign Key Column Reference
-- 
-- ISSUE: The constraint is named "project_event_roles_project_role_id_fkey"
-- but the actual column is "role_id" (not project_role_id)
-- 
-- From migration 20250807025200_add_event_roles_fk.sql:
-- FOREIGN KEY (role_id) REFERENCES project_roles(id)
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
  
  -- ✅ FIXED: Use correct column name 'role_id' 
  -- The constraint project_event_roles_project_role_id_fkey actually uses role_id column
  -- that references project_roles(id)
  INSERT INTO project_event_roles (
    project_id,
    event_id, 
    role_id,           -- ✅ CORRECT: Use role_id column
    crew_member_id,
    daily_rate,
    created_at,
    updated_at
  )
  SELECT DISTINCT ON (pr.id)
    p_project_id,
    p_event_id,
    pr.id,             -- ✅ CORRECT: Use project_roles.id as the foreign key value
    pr.preferred_id,
    pr.daily_rate,
    NOW(),
    NOW()
  FROM project_roles pr
  WHERE pr.project_id = p_project_id
    AND pr.variant_id = v_actual_variant_id
  ORDER BY pr.id, pr.updated_at DESC
  ON CONFLICT (event_id, role_id) DO UPDATE SET
    crew_member_id = EXCLUDED.crew_member_id,
    daily_rate = EXCLUDED.daily_rate,
    updated_at = NOW();
  
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
