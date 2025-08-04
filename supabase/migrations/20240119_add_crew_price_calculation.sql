-- Extend existing sync_event_crew function to calculate crew_price
-- This follows the same pattern as sync_event_equipment_unified

CREATE OR REPLACE FUNCTION sync_event_crew(p_event_id uuid, p_project_id uuid)
RETURNS void AS $$
DECLARE
  v_crew_rate_multiplier DECIMAL;
BEGIN
  -- Get the event's crew rate multiplier
  SELECT et.crew_rate_multiplier INTO v_crew_rate_multiplier
  FROM project_events pe
  JOIN event_types et ON pe.event_type_id = et.id
  WHERE pe.id = p_event_id;
  
  -- Default to 1.0 if no multiplier found
  IF v_crew_rate_multiplier IS NULL THEN
    v_crew_rate_multiplier := 1.0;
  END IF;

  -- Delete existing event crew for this event
  DELETE FROM project_event_roles 
  WHERE event_id = p_event_id;
  
  -- Insert project crew roles with deduplication and conflict resolution
  -- Use DISTINCT ON to ensure only one row per role_id
  INSERT INTO project_event_roles (
    project_id,
    event_id, 
    role_id,
    crew_member_id,
    daily_rate,
    hourly_rate,
    hourly_category,
    total_cost,
    created_at,
    updated_at
  )
  SELECT DISTINCT ON (role_id)
    p_project_id,
    p_event_id,
    role_id,
    preferred_id, -- Use preferred crew member
    daily_rate,
    hourly_rate,
    hourly_category,
    daily_rate, -- Set total_cost to daily_rate initially
    NOW(),
    NOW()
  FROM project_roles 
  WHERE project_id = p_project_id
  ORDER BY role_id, updated_at DESC -- Use most recent entry if duplicates exist
  ON CONFLICT (event_id, role_id) 
  DO UPDATE SET 
    crew_member_id = EXCLUDED.crew_member_id,
    daily_rate = EXCLUDED.daily_rate,
    hourly_rate = EXCLUDED.hourly_rate,
    hourly_category = EXCLUDED.hourly_category,
    total_cost = EXCLUDED.total_cost,
    updated_at = NOW();

  -- NEW: Calculate and update crew_price (following equipment pattern)
  -- This calculates cost from EVENT-SPECIFIC role requirements (customer-facing)
  UPDATE project_events 
  SET 
    crew_price = COALESCE((
      SELECT SUM(COALESCE(daily_rate, 0) * v_crew_rate_multiplier)
      FROM project_event_roles 
      WHERE event_id = p_event_id
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
$$ LANGUAGE plpgsql SECURITY DEFINER;