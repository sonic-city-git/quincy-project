-- Create unified equipment sync function that handles everything correctly
-- This replaces all the different sync methods with one comprehensive solution

CREATE OR REPLACE FUNCTION sync_event_equipment_unified(p_event_id uuid, p_project_id uuid)
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
  
  -- Insert project equipment with proper pricing calculation
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a simpler alias for backward compatibility
CREATE OR REPLACE FUNCTION sync_event_equipment(p_event_id uuid, p_project_id uuid)
RETURNS void AS $$
BEGIN
  -- Just call the unified function
  PERFORM sync_event_equipment_unified(p_event_id, p_project_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION sync_event_equipment_unified(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_event_equipment(uuid, uuid) TO authenticated;