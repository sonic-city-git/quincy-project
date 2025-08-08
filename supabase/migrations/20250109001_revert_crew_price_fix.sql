-- Revert the previous crew price "fix" - the original logic was correct
-- 
-- BUSINESS LOGIC: Event with variant → calculate crew price from variant's crew roles
-- This means if variant has crew roles, events using that variant should show crew price
-- even if no crew is assigned to the specific event.

CREATE OR REPLACE FUNCTION sync_event_crew(
  p_event_id uuid,
  p_project_id uuid, 
  p_variant_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_crew_rate_multiplier DECIMAL;
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
      WHERE project_id = p_project_id AND is_default = true
      LIMIT 1;
    END IF;
  ELSE
    v_actual_variant_id := p_variant_id;
  END IF;

  -- Get the event's crew rate multiplier
  SELECT et.crew_rate_multiplier INTO v_crew_rate_multiplier
  FROM project_events pe
  JOIN event_types et ON pe.event_type_id = et.id  
  WHERE pe.id = p_event_id;
  
  -- Default to 1.0 if no multiplier found
  IF v_crew_rate_multiplier IS NULL THEN
    v_crew_rate_multiplier := 1.0;
  END IF;
  
  -- Delete existing crew assignments for this event
  DELETE FROM project_event_roles 
  WHERE event_id = p_event_id;
  
  -- Insert crew roles for the specified variant
  INSERT INTO project_event_roles (
    project_id,
    event_id, 
    role_id,
    crew_member_id,
    notes,
    is_synced,
    created_at,
    updated_at
  )
  SELECT DISTINCT ON (pr.role_id)
    p_project_id,
    p_event_id,
    pr.role_id,
    pr.preferred_id, -- Use preferred crew member if set
    pr.notes,
    true, -- is_synced 
    NOW(),
    NOW()
  FROM project_roles pr
  WHERE pr.project_id = p_project_id
    AND pr.variant_id = v_actual_variant_id
  ORDER BY pr.role_id, pr.updated_at DESC; -- Use most recent if duplicates
  
  -- ✅ CORRECT: Calculate crew_price from variant's crew roles
  -- This reflects the cost of the variant configuration, not individual assignments
  UPDATE project_events 
  SET 
    crew_price = COALESCE((
      SELECT SUM(COALESCE(pr.daily_rate, 0) * v_crew_rate_multiplier)
      FROM project_roles pr 
      WHERE pr.project_id = p_project_id
        AND pr.variant_id = v_actual_variant_id  -- ✅ Calculate from variant
    ), 0),
    updated_at = NOW()
  WHERE id = p_event_id;
  
  -- Update total_price (equipment_price + crew_price)
  UPDATE project_events 
  SET 
    total_price = COALESCE(equipment_price, 0) + COALESCE(crew_price, 0),
    updated_at = NOW()
  WHERE id = p_event_id;

END;
$$ LANGUAGE plpgsql;
