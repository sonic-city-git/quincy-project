-- Create sync_event_equipment function
CREATE OR REPLACE FUNCTION sync_event_equipment(p_event_id uuid, p_project_id uuid)
RETURNS void AS $$
BEGIN
  -- Delete existing event equipment for this event
  DELETE FROM project_event_equipment 
  WHERE event_id = p_event_id;
  
  -- Copy all project equipment to this event with is_synced = true
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
  SELECT 
    p_project_id,
    p_event_id,
    equipment_id,
    quantity,
    group_id,
    true, -- is_synced
    NOW(),
    NOW()
  FROM project_equipment 
  WHERE project_id = p_project_id;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create sync_event_crew function (referenced in useSyncManager)
CREATE OR REPLACE FUNCTION sync_event_crew(p_event_id uuid, p_project_id uuid)
RETURNS void AS $$
BEGIN
  -- Delete existing event crew for this event
  DELETE FROM project_event_roles 
  WHERE event_id = p_event_id;
  
  -- Copy all project crew roles to this event with preferred crew members
  INSERT INTO project_event_roles (
    project_id,
    event_id, 
    role_id,
    member_id,
    preferred_id,
    created_at,
    updated_at
  )
  SELECT 
    p_project_id,
    p_event_id,
    role_id,
    member_id,
    preferred_id,
    NOW(),
    NOW()
  FROM project_roles 
  WHERE project_id = p_project_id;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION sync_event_equipment(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_event_crew(uuid, uuid) TO authenticated;