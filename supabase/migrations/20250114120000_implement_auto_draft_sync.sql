-- =====================================================================================
-- AUTO-DRAFT INVOICE SYNC SYSTEM
-- =====================================================================================
-- 
-- Implements automatic draft invoice management via database triggers
-- When events are marked as "invoice ready", they automatically get added to project drafts
-- When events are unmarked, they get removed from drafts
-- Ensures seamless sync without manual intervention

-- =====================================================================================
-- HELPER FUNCTIONS
-- =====================================================================================

-- Function to get or create a project's auto-draft invoice
CREATE OR REPLACE FUNCTION get_or_create_project_draft(p_project_id UUID)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    draft_id UUID;
    project_record RECORD;
BEGIN
    -- Check for existing auto-draft
    SELECT id INTO draft_id
    FROM invoices
    WHERE project_id = p_project_id
      AND is_auto_draft = true
      AND status = 'draft'
    LIMIT 1;
    
    -- If draft exists, return it
    IF draft_id IS NOT NULL THEN
        RETURN draft_id;
    END IF;
    
    -- Get project details for new draft
    SELECT * INTO project_record
    FROM projects
    WHERE id = p_project_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found: %', p_project_id;
    END IF;
    
    -- Create new auto-draft invoice
    INSERT INTO invoices (
        project_id,
        customer_id,
        is_auto_draft,
        status,
        invoice_date,
        due_date,
        total_amount,
        created_at,
        updated_at
    ) VALUES (
        p_project_id,
        project_record.customer_id,
        true,
        'draft',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        0,
        NOW(),
        NOW()
    )
    RETURNING id INTO draft_id;
    
    RETURN draft_id;
END;
$$;

-- Function to calculate and update draft invoice total
CREATE OR REPLACE FUNCTION update_draft_invoice_total(p_invoice_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    total_amount DECIMAL(10,2);
BEGIN
    -- Calculate total from linked events
    SELECT COALESCE(SUM(pe.total_price), 0)
    INTO total_amount
    FROM invoice_event_links iel
    JOIN project_events pe ON pe.id = iel.event_id
    WHERE iel.invoice_id = p_invoice_id;
    
    -- Update invoice total
    UPDATE invoices
    SET total_amount = total_amount,
        updated_at = NOW()
    WHERE id = p_invoice_id;
END;
$$;

-- Function to add event to project draft
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
        
        -- Log the action
        RAISE NOTICE 'Added event % to draft invoice %', p_event_id, draft_id;
    END IF;
END;
$$;

-- Function to remove event from draft
CREATE OR REPLACE FUNCTION remove_event_from_draft(p_event_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    event_record RECORD;
    draft_id UUID;
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
    
    -- Remove line items for this event
    DELETE FROM invoice_line_items
    WHERE invoice_id = draft_id AND source_event_id = p_event_id;
    
    -- Update draft total
    PERFORM update_draft_invoice_total(draft_id);
    
    -- Log the action
    RAISE NOTICE 'Removed event % from draft invoice %', p_event_id, draft_id;
END;
$$;

-- =====================================================================================
-- TRIGGER FUNCTIONS
-- =====================================================================================

-- Main trigger function for project_events changes
CREATE OR REPLACE FUNCTION handle_event_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Handle INSERT: New event marked as 'invoice ready'
    IF TG_OP = 'INSERT' THEN
        IF NEW.status = 'invoice ready' THEN
            PERFORM add_event_to_draft(NEW.id);
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE: Status change
    IF TG_OP = 'UPDATE' THEN
        -- Event became 'invoice ready'
        IF OLD.status != 'invoice ready' AND NEW.status = 'invoice ready' THEN
            PERFORM add_event_to_draft(NEW.id);
        END IF;
        
        -- Event no longer 'invoice ready'
        IF OLD.status = 'invoice ready' AND NEW.status != 'invoice ready' THEN
            PERFORM remove_event_from_draft(NEW.id);
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Handle DELETE: Remove from any drafts
    IF TG_OP = 'DELETE' THEN
        IF OLD.status = 'invoice ready' THEN
            PERFORM remove_event_from_draft(OLD.id);
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;

-- =====================================================================================
-- TRIGGERS
-- =====================================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_event_status_change ON project_events;

-- Create trigger for automatic draft management
CREATE TRIGGER trigger_event_status_change
    AFTER INSERT OR UPDATE OR DELETE ON project_events
    FOR EACH ROW
    EXECUTE FUNCTION handle_event_status_change();

-- =====================================================================================
-- INITIAL SYNC
-- =====================================================================================

-- Sync existing 'invoice ready' events to drafts
-- This ensures events that were already marked as 'invoice ready' get added to drafts
DO $$
DECLARE
    event_record RECORD;
BEGIN
    -- Process all existing 'invoice ready' events
    FOR event_record IN
        SELECT id FROM project_events WHERE status = 'invoice ready'
    LOOP
        PERFORM add_event_to_draft(event_record.id);
    END LOOP;
    
    RAISE NOTICE 'Initial sync completed for existing invoice-ready events';
END;
$$;

-- =====================================================================================
-- COMMENTS
-- =====================================================================================

COMMENT ON FUNCTION get_or_create_project_draft(UUID) IS 'Gets existing project auto-draft or creates new one';
COMMENT ON FUNCTION update_draft_invoice_total(UUID) IS 'Recalculates and updates draft invoice total from linked events';
COMMENT ON FUNCTION add_event_to_draft(UUID) IS 'Adds invoice-ready event to project auto-draft';
COMMENT ON FUNCTION remove_event_from_draft(UUID) IS 'Removes event from project auto-draft';
COMMENT ON FUNCTION handle_event_status_change() IS 'Trigger function for automatic draft invoice sync';
COMMENT ON TRIGGER trigger_event_status_change ON project_events IS 'Automatically manages draft invoices when event status changes';
