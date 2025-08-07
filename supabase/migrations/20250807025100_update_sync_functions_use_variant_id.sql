-- Migration: Update Sync Functions to Use variant_id Instead of variant_name
-- This updates all database functions to use the new UUID-based variant relationships

-- ============================================================================
-- UPDATED EQUIPMENT SYNC FUNCTION (UUID-based)
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_event_equipment_unified(
  p_event_id uuid, 
  p_project_id uuid,
  p_variant_id uuid DEFAULT NULL  -- Now accepts variant_id instead of variant_name
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
    AND pe.variant_id = v_actual_variant_id  -- ✅ Now uses UUID foreign key
  ORDER BY pe.equipment_id, pe.updated_at DESC; -- Use most recent if duplicates
  
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
  
  -- Update total_price (equipment_price + crew_price)
  UPDATE project_events 
  SET 
    total_price = COALESCE(equipment_price, 0) + COALESCE(crew_price, 0),
    updated_at = NOW()
  WHERE id = p_event_id;

END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UPDATED CREW SYNC FUNCTION (UUID-based)  
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_event_crew(
  p_event_id uuid,
  p_project_id uuid, 
  p_variant_id uuid DEFAULT NULL  -- Now accepts variant_id instead of variant_name
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
      WHERE project_id = p_project_id AND variant_name = 'default';
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
    AND pr.variant_id = v_actual_variant_id  -- ✅ Now uses UUID foreign key
  ORDER BY pr.role_id, pr.updated_at DESC; -- Use most recent if duplicates
  
  -- Update the event's crew_price with calculated total
  UPDATE project_events 
  SET 
    crew_price = COALESCE((
      SELECT SUM(COALESCE(pr.daily_rate, 0) * v_crew_rate_multiplier)
      FROM project_roles pr 
      WHERE pr.project_id = p_project_id
        AND pr.variant_id = v_actual_variant_id  -- ✅ Now uses UUID foreign key
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

-- ============================================================================
-- UPDATED VARIANT SYNC FUNCTION (UUID-based)
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_event_variant(
  p_event_id uuid,
  p_project_id uuid,
  p_variant_id uuid  -- Now requires variant_id instead of variant_name
)
RETURNS void AS $$
BEGIN
  -- Update the event's variant using UUID
  UPDATE project_events 
  SET variant_id = p_variant_id,
      updated_at = NOW()
  WHERE id = p_event_id AND project_id = p_project_id;

  -- Sync equipment for the variant
  PERFORM sync_event_equipment_unified(p_event_id, p_project_id, p_variant_id);
  
  -- Sync crew for the variant  
  PERFORM sync_event_crew(p_event_id, p_project_id, p_variant_id);
  
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTION: Get variant_id from variant_name (transition period)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_variant_id_by_name(
  p_project_id uuid,
  p_variant_name text
)
RETURNS uuid AS $$
DECLARE
  v_variant_id uuid;
BEGIN
  SELECT id INTO v_variant_id
  FROM project_variants
  WHERE project_id = p_project_id 
    AND variant_name = p_variant_name;
    
  IF v_variant_id IS NULL THEN
    RAISE EXCEPTION 'Variant "%" not found for project %', p_variant_name, p_project_id;
  END IF;
  
  RETURN v_variant_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- BACKWARD COMPATIBILITY WRAPPER FUNCTIONS
-- ============================================================================
-- These allow existing code to continue working during the transition period

CREATE OR REPLACE FUNCTION sync_event_equipment_unified(
  p_event_id uuid, 
  p_project_id uuid,
  p_variant_name text DEFAULT 'default'  -- Old signature for compatibility
)
RETURNS void AS $$
DECLARE
  v_variant_id uuid;
BEGIN
  -- Convert variant_name to variant_id
  v_variant_id := get_variant_id_by_name(p_project_id, p_variant_name);
  
  -- Call the new UUID-based function
  PERFORM sync_event_equipment_unified(p_event_id, p_project_id, v_variant_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_event_crew(
  p_event_id uuid,
  p_project_id uuid,
  p_variant_name text DEFAULT 'default'  -- Old signature for compatibility
)
RETURNS void AS $$
DECLARE
  v_variant_id uuid;
BEGIN
  -- Convert variant_name to variant_id
  v_variant_id := get_variant_id_by_name(p_project_id, p_variant_name);
  
  -- Call the new UUID-based function
  PERFORM sync_event_crew(p_event_id, p_project_id, v_variant_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_event_variant(
  p_event_id uuid,
  p_project_id uuid,
  p_variant_name text DEFAULT 'default'  -- Old signature for compatibility
)
RETURNS void AS $$
DECLARE
  v_variant_id uuid;
BEGIN
  -- Convert variant_name to variant_id
  v_variant_id := get_variant_id_by_name(p_project_id, p_variant_name);
  
  -- Call the new UUID-based function
  PERFORM sync_event_variant(p_event_id, p_project_id, v_variant_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Sync functions updated to use variant_id (UUID foreign keys)';
  RAISE NOTICE 'Backward compatibility maintained for existing variant_name calls';
  RAISE NOTICE 'Next: Update application code to use variant_id instead of variant_name';
END $$;