-- =====================================================================================
-- FIX SOURCE_EVENT_ID COLUMN REFERENCES
-- =====================================================================================
-- 
-- The invoice_line_items table uses 'source_id' not 'source_event_id'
-- This fixes all database functions to use the correct column name

-- =====================================================================================
-- FIX CREATE_LINE_ITEMS_FOR_EVENT FUNCTION
-- =====================================================================================

CREATE OR REPLACE FUNCTION create_line_items_for_event(p_invoice_id UUID, p_event_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    event_record RECORD;
    crew_line_description TEXT;
    equipment_line_description TEXT;
BEGIN
    -- Get event details
    SELECT pe.*, et.name as event_type_name, et.crew_rate_multiplier
    INTO event_record
    FROM project_events pe
    JOIN event_types et ON et.id = pe.event_type_id
    WHERE pe.id = p_event_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found: %', p_event_id;
    END IF;
    
    -- Create crew line item if crew price > 0
    IF event_record.crew_price > 0 THEN
        crew_line_description := format('%s - %s - Crew Services', 
            event_record.name, 
            event_record.event_type_name
        );
        
        INSERT INTO invoice_line_items (
            invoice_id,
            description,
            quantity,
            unit_price,
            total_price,
            tax_rate,
            line_total,
            vat_type,
            vat_rate,
            vat_amount,
            source_type,
            source_id,  -- Fixed: was source_event_id
            sort_order,
            is_editable,
            created_at,
            updated_at
        ) VALUES (
            p_invoice_id,
            crew_line_description,
            1,
            event_record.crew_price,
            event_record.crew_price,
            0.25, -- 25% VAT
            event_record.crew_price * 1.25,
            'HIGH',
            0.25,
            event_record.crew_price * 0.25,
            'event_crew',
            p_event_id::text,  -- Fixed: was source_event_id
            1,
            false,
            NOW(),
            NOW()
        );
    END IF;
    
    -- Create equipment line item if equipment price > 0
    IF event_record.equipment_price > 0 THEN
        equipment_line_description := format('%s - %s - Equipment Rental', 
            event_record.name, 
            event_record.event_type_name
        );
        
        INSERT INTO invoice_line_items (
            invoice_id,
            description,
            quantity,
            unit_price,
            total_price,
            tax_rate,
            line_total,
            vat_type,
            vat_rate,
            vat_amount,
            source_type,
            source_id,  -- Fixed: was source_event_id
            sort_order,
            is_editable,
            created_at,
            updated_at
        ) VALUES (
            p_invoice_id,
            equipment_line_description,
            1,
            event_record.equipment_price,
            event_record.equipment_price,
            0.25, -- 25% VAT
            event_record.equipment_price * 1.25,
            'HIGH',
            0.25,
            event_record.equipment_price * 0.25,
            'event_equipment',
            p_event_id::text,  -- Fixed: was source_event_id
            2,
            false,
            NOW(),
            NOW()
        );
    END IF;
    
    RAISE NOTICE 'Created line items for event %', p_event_id;
END;
$$;

-- =====================================================================================
-- FIX REMOVE_EVENT_FROM_DRAFT_INVOICES FUNCTION
-- =====================================================================================

CREATE OR REPLACE FUNCTION remove_event_from_draft_invoices(p_event_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    removed_links INTEGER;
    removed_items INTEGER;
BEGIN
    -- Remove event from all draft invoices
    DELETE FROM invoice_event_links
    WHERE event_id = p_event_id
    AND invoice_id IN (
        SELECT id FROM invoices 
        WHERE status = 'draft' AND is_auto_draft = true
    );
    
    GET DIAGNOSTICS removed_links = ROW_COUNT;
    
    -- Remove line items for this event from all draft invoices
    DELETE FROM invoice_line_items
    WHERE source_id = p_event_id::text  -- Fixed: was source_event_id
    AND source_type IN ('event_crew', 'event_equipment')
    AND invoice_id IN (
        SELECT id FROM invoices 
        WHERE status = 'draft' AND is_auto_draft = true
    );
    
    GET DIAGNOSTICS removed_items = ROW_COUNT;
    
    -- Update totals for affected draft invoices
    UPDATE invoices
    SET 
        total_amount = COALESCE((
            SELECT SUM(line_total)
            FROM invoice_line_items
            WHERE invoice_id = invoices.id
        ), 0),
        updated_at = NOW()
    WHERE status = 'draft' 
    AND is_auto_draft = true
    AND id IN (
        SELECT DISTINCT invoice_id 
        FROM invoice_line_items 
        WHERE invoice_id = invoices.id
    );
    
    RAISE NOTICE 'Removed event % from % draft links and % line items', p_event_id, removed_links, removed_items;
END;
$$;

-- =====================================================================================
-- FIX REMOVE_EVENT_FROM_DRAFT FUNCTION (used by triggers)
-- =====================================================================================

CREATE OR REPLACE FUNCTION remove_event_from_draft(p_event_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    event_record RECORD;
    draft_id UUID;
    removed_count INTEGER;
    should_sync_to_fiken BOOLEAN := FALSE;
BEGIN
    -- Get event details
    SELECT * INTO event_record
    FROM project_events
    WHERE id = p_event_id;
    
    IF NOT FOUND THEN
        RETURN; -- Event might have been deleted
    END IF;
    
    -- Find the project's draft invoice
    SELECT id INTO draft_id
    FROM invoices
    WHERE project_id = event_record.project_id
      AND is_auto_draft = true
      AND status = 'draft'
    LIMIT 1;
    
    IF draft_id IS NULL THEN
        RETURN; -- No draft to remove from
    END IF;
    
    -- Remove event from draft
    DELETE FROM invoice_event_links
    WHERE invoice_id = draft_id AND event_id = p_event_id;
    
    GET DIAGNOSTICS removed_count = ROW_COUNT;
    
    -- Only proceed if we actually removed something
    IF removed_count > 0 THEN
        -- Remove line items for this event
        DELETE FROM invoice_line_items
        WHERE invoice_id = draft_id AND source_id = p_event_id::text;  -- Fixed: was source_event_id
        
        -- Update draft total
        PERFORM update_draft_invoice_total(draft_id);
        
        -- Mark that we should sync to Fiken
        should_sync_to_fiken := TRUE;
        
        RAISE NOTICE 'Removed event % from draft invoice %', p_event_id, draft_id;
    END IF;
    
    -- Sync to Fiken if we made changes
    IF should_sync_to_fiken THEN
        PERFORM sync_draft_to_fiken(draft_id);
    END IF;
END;
$$;

-- =====================================================================================
-- COMMENTS
-- =====================================================================================

COMMENT ON FUNCTION create_line_items_for_event(UUID, UUID) IS 'Fixed: Creates line items using source_id column';
COMMENT ON FUNCTION remove_event_from_draft_invoices(UUID) IS 'Fixed: Removes line items using source_id column';
COMMENT ON FUNCTION remove_event_from_draft(UUID) IS 'Fixed: Removes line items using source_id column for triggers';
