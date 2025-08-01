-- Fix sync function to handle duplicate equipment entries
-- This prevents "ON CONFLICT DO UPDATE command cannot affect row a second time" error

-- Update sync_event_equipment function with proper deduplication
CREATE OR REPLACE FUNCTION sync_event_equipment(p_event_id uuid, p_project_id uuid)
RETURNS void AS $$
BEGIN
  -- Delete existing event equipment for this event
  DELETE FROM project_event_equipment 
  WHERE event_id = p_event_id;
  
  -- Insert project equipment with deduplication and conflict resolution
  -- Use DISTINCT ON to ensure only one row per equipment_id
  INSERT INTO project_event_equipment (
    project_id, 
    event_id, 
    equipment_id, 
    quantity, 
    group_id, 
    is_synced,
    created_at,
    updated_at
  )
  SELECT DISTINCT ON (equipment_id)
    p_project_id,
    p_event_id,
    equipment_id,
    quantity,
    group_id,
    true, -- is_synced
    NOW(),
    NOW()
  FROM project_equipment 
  WHERE project_id = p_project_id
  ORDER BY equipment_id, updated_at DESC -- Use most recent entry if duplicates exist
  ON CONFLICT (event_id, equipment_id) 
  DO UPDATE SET 
    quantity = EXCLUDED.quantity,
    group_id = EXCLUDED.group_id,
    is_synced = true,
    updated_at = NOW();
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update sync_event_crew function with proper deduplication
CREATE OR REPLACE FUNCTION sync_event_crew(p_event_id uuid, p_project_id uuid)
RETURNS void AS $$
BEGIN
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
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;