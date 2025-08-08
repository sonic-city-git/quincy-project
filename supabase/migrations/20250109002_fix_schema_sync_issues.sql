-- Fix schema mismatches causing sync failures
-- 
-- ISSUES FOUND:
-- 1. Missing 'is_synced' column in project_event_roles table
-- 2. Function sync_event_equipment_unified exists but with wrong signature
--
-- FIXES:
-- 1. Add is_synced column to project_event_roles
-- 2. Update sync_event_equipment_unified to accept variant_id parameter

-- ============================================================================
-- FIX 1: Add missing is_synced column to project_event_roles
-- ============================================================================

ALTER TABLE project_event_roles 
ADD COLUMN IF NOT EXISTS is_synced boolean DEFAULT false;

-- Update existing records to be marked as synced
UPDATE project_event_roles SET is_synced = true WHERE is_synced IS NULL;

-- ============================================================================
-- FIX 2: Update sync_event_equipment_unified function signature
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_event_equipment_unified(
  p_event_id uuid,
  p_project_id uuid, 
  p_variant_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_event_type_multiplier DECIMAL := 1.0;
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

  -- Get event type equipment multiplier
  SELECT COALESCE(et.equipment_price_multiplier, 1.0) INTO v_event_type_multiplier
  FROM project_events pe
  JOIN event_types et ON pe.event_type_id = et.id
  WHERE pe.id = p_event_id;
  
  -- Delete existing equipment assignments for this event
  DELETE FROM project_event_equipment 
  WHERE event_id = p_event_id;
  
  -- Insert equipment for the specified variant
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
    AND pe.variant_id = v_actual_variant_id
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
