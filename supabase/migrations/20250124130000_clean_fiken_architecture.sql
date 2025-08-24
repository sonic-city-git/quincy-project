-- =====================================================================================
-- CLEAN FIKEN ARCHITECTURE
-- =====================================================================================
-- 
-- Removes problematic database-level Fiken sync functions and simplifies triggers
-- to only handle draft invoice management. Fiken sync will be moved to application layer.

-- =====================================================================================
-- REMOVE PROBLEMATIC FUNCTIONS
-- =====================================================================================

-- Remove the problematic sync function that tries to call Edge Functions from database
DROP FUNCTION IF EXISTS sync_draft_to_fiken(UUID);

-- =====================================================================================
-- SIMPLIFIED DRAFT MANAGEMENT FUNCTIONS
-- =====================================================================================

-- Keep the core draft management functions but remove Fiken sync calls
CREATE OR REPLACE FUNCTION add_event_to_draft(p_event_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    event_record RECORD;
    draft_id UUID;
    existing_link_id UUID;
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
        
        -- Mark invoice as needing Fiken sync (application will handle this)
        UPDATE invoices 
        SET 
            needs_fiken_sync = true,
            updated_at = NOW()
        WHERE id = draft_id;
        
        RAISE NOTICE 'Added event % to draft invoice % (marked for Fiken sync)', p_event_id, draft_id;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION remove_event_from_draft(p_event_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    event_record RECORD;
    draft_id UUID;
    removed_count INTEGER;
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
        WHERE invoice_id = draft_id AND source_id = p_event_id::text;
        
        -- Update draft total
        PERFORM update_draft_invoice_total(draft_id);
        
        -- Mark invoice as needing Fiken sync (application will handle this)
        UPDATE invoices 
        SET 
            needs_fiken_sync = true,
            updated_at = NOW()
        WHERE id = draft_id;
        
        RAISE NOTICE 'Removed event % from draft invoice % (marked for Fiken sync)', p_event_id, draft_id;
    END IF;
END;
$$;

-- =====================================================================================
-- ADD SYNC TRACKING COLUMN
-- =====================================================================================

-- Add column to track which invoices need Fiken sync
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS needs_fiken_sync BOOLEAN DEFAULT false;

-- Add index for efficient querying of invoices that need sync
CREATE INDEX IF NOT EXISTS idx_invoices_needs_fiken_sync 
ON invoices (needs_fiken_sync) 
WHERE needs_fiken_sync = true;

-- =====================================================================================
-- HELPER FUNCTIONS FOR APPLICATION LAYER
-- =====================================================================================

-- Function to get invoices that need Fiken sync
CREATE OR REPLACE FUNCTION get_invoices_needing_fiken_sync()
RETURNS TABLE (
    invoice_id UUID,
    project_id UUID,
    project_name TEXT,
    customer_id UUID,
    customer_name TEXT,
    customer_fiken_id TEXT,
    total_amount NUMERIC,
    due_date DATE,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id as invoice_id,
        i.project_id,
        p.name as project_name,
        p.customer_id,
        c.name as customer_name,
        c.fiken_customer_id as customer_fiken_id,
        i.total_amount,
        i.due_date,
        i.updated_at
    FROM invoices i
    JOIN projects p ON p.id = i.project_id
    LEFT JOIN customers c ON c.id = p.customer_id
    WHERE i.needs_fiken_sync = true
      AND i.is_auto_draft = true
      AND i.status = 'draft'
      AND i.total_amount > 0
      AND c.fiken_customer_id IS NOT NULL
    ORDER BY i.updated_at ASC;
END;
$$;

-- Function to mark invoice as synced to Fiken
CREATE OR REPLACE FUNCTION mark_invoice_synced_to_fiken(
    p_invoice_id UUID,
    p_fiken_invoice_id TEXT,
    p_fiken_invoice_number TEXT,
    p_fiken_url TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE invoices
    SET 
        needs_fiken_sync = false,
        fiken_invoice_id = p_fiken_invoice_id,
        fiken_invoice_number = p_fiken_invoice_number,
        fiken_url = p_fiken_url,
        updated_at = NOW()
    WHERE id = p_invoice_id;
    
    RAISE NOTICE 'Marked invoice % as synced to Fiken: %', p_invoice_id, p_fiken_invoice_number;
END;
$$;

-- Function to mark invoice sync as failed
CREATE OR REPLACE FUNCTION mark_invoice_sync_failed(
    p_invoice_id UUID,
    p_error_message TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE invoices
    SET 
        needs_fiken_sync = false, -- Don't retry immediately
        fiken_sync_error = p_error_message,
        fiken_sync_failed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_invoice_id;
    
    RAISE NOTICE 'Marked invoice % sync as failed: %', p_invoice_id, p_error_message;
END;
$$;

-- =====================================================================================
-- ADD ERROR TRACKING COLUMNS
-- =====================================================================================

-- Add columns to track sync errors
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS fiken_sync_error TEXT,
ADD COLUMN IF NOT EXISTS fiken_sync_failed_at TIMESTAMPTZ;

-- =====================================================================================
-- MARK EXISTING DRAFTS FOR SYNC
-- =====================================================================================

-- Mark existing auto-draft invoices that have events but no Fiken data
UPDATE invoices 
SET needs_fiken_sync = true
WHERE is_auto_draft = true 
  AND status = 'draft'
  AND total_amount > 0
  AND fiken_invoice_id IS NULL
  AND EXISTS (
    SELECT 1 FROM invoice_event_links iel 
    WHERE iel.invoice_id = invoices.id
  );

-- =====================================================================================
-- COMMENTS
-- =====================================================================================

COMMENT ON FUNCTION add_event_to_draft(UUID) IS 'Simplified: Only handles draft management, marks for application-level Fiken sync';
COMMENT ON FUNCTION remove_event_from_draft(UUID) IS 'Simplified: Only handles draft management, marks for application-level Fiken sync';
COMMENT ON FUNCTION get_invoices_needing_fiken_sync() IS 'Helper: Returns invoices that need to be synced to Fiken by application';
COMMENT ON FUNCTION mark_invoice_synced_to_fiken(UUID, TEXT, TEXT, TEXT) IS 'Helper: Marks invoice as successfully synced to Fiken';
COMMENT ON FUNCTION mark_invoice_sync_failed(UUID, TEXT) IS 'Helper: Marks invoice sync as failed with error message';

COMMENT ON COLUMN invoices.needs_fiken_sync IS 'Flag indicating invoice needs to be synced to Fiken by application';
COMMENT ON COLUMN invoices.fiken_sync_error IS 'Last error message from Fiken sync attempt';
COMMENT ON COLUMN invoices.fiken_sync_failed_at IS 'Timestamp of last failed Fiken sync attempt';
