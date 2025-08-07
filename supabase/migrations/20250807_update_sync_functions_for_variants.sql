-- Migration: Update sync functions to be variant-aware
-- This makes equipment and crew syncing respect the event's variant

-- Create variant-aware equipment sync function
CREATE OR REPLACE FUNCTION sync_event_equipment_unified(
  p_event_id uuid, 
  p_project_id uuid,
  p_variant_name text DEFAULT 'default'
)
RETURNS void AS $$
DECLARE
  v_event_type_multiplier DECIMAL;
BEGIN
  -- Get the event's equipment rate multiplier
  SELECT et.equipment_rate_multiplier INTO v_event_type_multiplier
  FROM project_events pe
  JOIN event_types et ON pe.event_type_id = et.id
  WHERE pe.id = p_event_id;
  
  -- Default to 1.0 if no multiplier found
  IF v_event_type_multiplier IS NULL THEN
    v_event_type_multiplier := 1.0;
  END IF;
  
  -- Delete ALL existing event equipment for this event (clean slate)
  DELETE FROM project_event_equipment 
  WHERE event_id = p_event_id;
  
  -- Insert project equipment for the specified variant with proper pricing calculation
  INSERT INTO project_event_equipment (
    project_id, 
    event_id, 
    equipment_id, 
    quantity, 
    group_id,
    notes,
    is_synced,
    created_at,
    updated_at
  )
  SELECT DISTINCT ON (pe.equipment_id)
    p_project_id,
    p_event_id,
    pe.equipment_id,
    pe.quantity,
    pe.group_id,
    pe.notes,
    true, -- is_synced
    NOW(),
    NOW()
  FROM project_equipment pe
  WHERE pe.project_id = p_project_id 
    AND pe.variant_name = p_variant_name  -- NEW: Filter by variant
  ORDER BY pe.equipment_id, pe.updated_at DESC; -- Use most recent if duplicates
  
  -- Update the event's equipment_price with calculated total
  -- This uses the equipment rental_price * quantity * event_type_multiplier
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
  
  -- Update total_price (equipment_price + crew_price)
  UPDATE project_events 
  SET 
    total_price = COALESCE(equipment_price, 0) + COALESCE(crew_price, 0),
    updated_at = NOW()
  WHERE id = p_event_id;
  
END;
$$ LANGUAGE plpgsql;

-- Create variant-aware crew sync function
CREATE OR REPLACE FUNCTION sync_event_crew(
  p_event_id uuid,
  p_project_id uuid,
  p_variant_name text DEFAULT 'default'
)
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
  
  -- Insert project crew roles for the specified variant with deduplication and conflict resolution
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
    AND variant_name = p_variant_name  -- NEW: Filter by variant
  ORDER BY role_id, updated_at DESC -- Use most recent entry if duplicates exist
  ON CONFLICT (event_id, role_id) 
  DO UPDATE SET 
    crew_member_id = EXCLUDED.crew_member_id,
    daily_rate = EXCLUDED.daily_rate,
    hourly_rate = EXCLUDED.hourly_rate,
    hourly_category = EXCLUDED.hourly_category,
    total_cost = EXCLUDED.total_cost,
    updated_at = NOW();

  -- Calculate and update crew_price (following equipment pattern)
  -- This calculates cost from project role requirements (customer-facing)
  UPDATE project_events 
  SET 
    crew_price = COALESCE((
      SELECT SUM(COALESCE(daily_rate, 0) * v_crew_rate_multiplier)
      FROM project_roles 
      WHERE project_id = p_project_id
        AND variant_name = p_variant_name  -- NEW: Filter by variant
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

-- Create a convenience function that syncs both equipment and crew for a variant
CREATE OR REPLACE FUNCTION sync_event_variant(
  p_event_id uuid,
  p_project_id uuid,
  p_variant_name text DEFAULT 'default'
)
RETURNS void AS $$
BEGIN
  -- Update the event's variant
  UPDATE project_events 
  SET variant_name = p_variant_name,
      updated_at = NOW()
  WHERE id = p_event_id AND project_id = p_project_id;

  -- Sync equipment for the variant
  PERFORM sync_event_equipment_unified(p_event_id, p_project_id, p_variant_name);
  
  -- Sync crew for the variant
  PERFORM sync_event_crew(p_event_id, p_project_id, p_variant_name);
  
END;
$$ LANGUAGE plpgsql;