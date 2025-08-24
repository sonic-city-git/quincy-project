-- =====================================================================================
-- COMPLETE FIKEN AUTO-SYNC SYSTEM
-- =====================================================================================
-- 
-- Enhances the auto-draft system to also create and sync drafts in Fiken
-- When events are marked as "invoice ready", they automatically:
-- 1. Get added to Supabase draft invoice (existing functionality)
-- 2. Create/update corresponding draft in Fiken (new functionality)

-- =====================================================================================
-- ENHANCED FUNCTIONS WITH FIKEN INTEGRATION
-- =====================================================================================

-- Function to sync draft invoice to Fiken
CREATE OR REPLACE FUNCTION sync_draft_to_fiken(p_invoice_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    invoice_record RECORD;
    project_record RECORD;
    customer_record RECORD;
    fiken_result JSONB;
BEGIN
    -- Get invoice details with project and customer info
    SELECT i.*, p.name as project_name, p.customer_id
    INTO invoice_record
    FROM invoices i
    JOIN projects p ON p.id = i.project_id
    WHERE i.id = p_invoice_id;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'Invoice not found: %', p_invoice_id;
        RETURN;
    END IF;
    
    -- Skip if not an auto-draft
    IF NOT invoice_record.is_auto_draft OR invoice_record.status != 'draft' THEN
        RETURN;
    END IF;
    
    -- Skip if no customer
    IF invoice_record.customer_id IS NULL THEN
        RAISE NOTICE 'No customer for invoice %, skipping Fiken sync', p_invoice_id;
        RETURN;
    END IF;
    
    -- Get customer details
    SELECT * INTO customer_record
    FROM customers
    WHERE id = invoice_record.customer_id;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'Customer not found for invoice %', p_invoice_id;
        RETURN;
    END IF;
    
    -- Skip if customer has no Fiken ID
    IF customer_record.fiken_customer_id IS NULL THEN
        RAISE NOTICE 'Customer % has no Fiken ID, skipping sync', customer_record.name;
        RETURN;
    END IF;
    
    -- Only sync if invoice has events (line items)
    IF invoice_record.total_amount <= 0 THEN
        RAISE NOTICE 'Invoice % has no amount, skipping Fiken sync', p_invoice_id;
        RETURN;
    END IF;
    
    BEGIN
        -- Call Fiken Edge Function to create/update draft
        SELECT content INTO fiken_result
        FROM http((
            'POST',
            current_setting('app.supabase_url') || '/functions/v1/fiken-invoice',
            ARRAY[
                http_header('Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')),
                http_header('Content-Type', 'application/json')
            ],
            'application/json',
            json_build_object(
                'action', 'create_or_update_draft',
                'invoice_id', p_invoice_id,
                'project_name', invoice_record.project_name,
                'customer_fiken_id', customer_record.fiken_customer_id,
                'total_amount', invoice_record.total_amount,
                'due_date', (invoice_record.due_date)::text
            )::text
        ));
        
        -- Update invoice with Fiken data if successful
        IF fiken_result->>'success' = 'true' THEN
            UPDATE invoices
            SET 
                fiken_invoice_id = fiken_result->>'fiken_invoice_id',
                fiken_invoice_number = fiken_result->>'fiken_invoice_number',
                fiken_url = fiken_result->>'fiken_url',
                updated_at = NOW()
            WHERE id = p_invoice_id;
            
            RAISE NOTICE 'Successfully synced invoice % to Fiken: %', p_invoice_id, fiken_result->>'fiken_invoice_number';
        ELSE
            RAISE NOTICE 'Failed to sync invoice % to Fiken: %', p_invoice_id, fiken_result->>'error';
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        -- Log error but don't fail the entire transaction
        RAISE NOTICE 'Error syncing invoice % to Fiken: %', p_invoice_id, SQLERRM;
    END;
END;
$$;

-- Enhanced function to add event to draft with Fiken sync
CREATE OR REPLACE FUNCTION add_event_to_draft(p_event_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    event_record RECORD;
    draft_id UUID;
    existing_link_id UUID;
    should_sync_to_fiken BOOLEAN := FALSE;
BEGIN
    -- Get event details
    SELECT * INTO event_record
    FROM project_events
    WHERE id = p_event_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found: %', p_event_id;
    END IF;
    
    -- Only process events with status 'invoice ready'
    IF event_record.status != 'invoice ready' THEN
        RETURN;
    END IF;
    
    -- Get or create project draft
    draft_id := get_or_create_project_draft(event_record.project_id);
    
    -- Check if event is already linked to this draft
    SELECT id INTO existing_link_id
    FROM invoice_event_links
    WHERE invoice_id = draft_id AND event_id = p_event_id;
    
    -- Add event to draft if not already linked
    IF existing_link_id IS NULL THEN
        INSERT INTO invoice_event_links (invoice_id, event_id, created_at)
        VALUES (draft_id, p_event_id, NOW());
        
        -- Create line items for the event
        PERFORM create_line_items_for_event(draft_id, p_event_id);
        
        -- Update draft total
        PERFORM update_draft_invoice_total(draft_id);
        
        -- Mark that we should sync to Fiken
        should_sync_to_fiken := TRUE;
        
        RAISE NOTICE 'Added event % to draft invoice %', p_event_id, draft_id;
    END IF;
    
    -- Sync to Fiken if we made changes
    IF should_sync_to_fiken THEN
        PERFORM sync_draft_to_fiken(draft_id);
    END IF;
END;
$$;

-- Enhanced function to remove event from draft with Fiken sync
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
        WHERE invoice_id = draft_id AND source_event_id = p_event_id;
        
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
-- FIKEN EDGE FUNCTION ENHANCEMENTS
-- =====================================================================================

-- We need to ensure the Edge Function supports the new actions
-- The fiken-invoice Edge Function should handle:
-- - action: 'create_or_update_draft'
-- - Parameters: invoice_id, project_name, customer_fiken_id, total_amount, due_date

-- =====================================================================================
-- CONFIGURATION SETTINGS
-- =====================================================================================

-- Set Supabase URL and anon key for HTTP calls
-- These should be set in your Supabase project settings
-- ALTER DATABASE postgres SET app.supabase_url = 'https://your-project.supabase.co';
-- ALTER DATABASE postgres SET app.supabase_anon_key = 'your-anon-key';

-- Note: The above settings need to be configured in your Supabase dashboard
-- Go to Settings > Database > Custom Postgres configuration

-- =====================================================================================
-- COMMENTS
-- =====================================================================================

COMMENT ON FUNCTION sync_draft_to_fiken(UUID) IS 'Syncs Supabase draft invoice to Fiken via Edge Function';
COMMENT ON FUNCTION add_event_to_draft(UUID) IS 'Enhanced: Adds event to draft and syncs to Fiken';
COMMENT ON FUNCTION remove_event_from_draft(UUID) IS 'Enhanced: Removes event from draft and syncs to Fiken';

-- =====================================================================================
-- INITIAL SYNC FOR EXISTING DRAFTS
-- =====================================================================================

-- Sync existing drafts to Fiken
DO $$
DECLARE
    draft_record RECORD;
BEGIN
    -- Process all existing auto-draft invoices that have events
    FOR draft_record IN
        SELECT DISTINCT i.id
        FROM invoices i
        JOIN invoice_event_links iel ON iel.invoice_id = i.id
        WHERE i.is_auto_draft = true 
          AND i.status = 'draft'
          AND i.total_amount > 0
    LOOP
        PERFORM sync_draft_to_fiken(draft_record.id);
    END LOOP;
    
    RAISE NOTICE 'Initial Fiken sync completed for existing drafts';
END;
$$;
