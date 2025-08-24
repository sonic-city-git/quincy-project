-- =====================================================================================
-- FIX FIKEN HTTP CALLS
-- =====================================================================================
-- 
-- Fixes the HTTP calls to Fiken Edge Function using pg_net extension
-- Replaces the problematic http() function with net.http_post()

-- =====================================================================================
-- ENABLE REQUIRED EXTENSIONS
-- =====================================================================================

-- Enable pg_net extension for HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net;

-- =====================================================================================
-- UPDATED FIKEN SYNC FUNCTION
-- =====================================================================================

-- Function to sync draft invoice to Fiken using pg_net
CREATE OR REPLACE FUNCTION sync_draft_to_fiken(p_invoice_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    invoice_record RECORD;
    project_record RECORD;
    customer_record RECORD;
    request_body JSONB;
    response_id BIGINT;
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
    
    -- Build request body
    request_body := json_build_object(
        'action', 'create_or_update_draft',
        'invoice_id', p_invoice_id,
        'project_name', invoice_record.project_name,
        'customer_fiken_id', customer_record.fiken_customer_id,
        'total_amount', invoice_record.total_amount,
        'due_date', (invoice_record.due_date)::text
    );
    
    BEGIN
        -- Use pg_net to make HTTP request to Edge Function
        SELECT net.http_post(
            url := current_setting('app.supabase_url', true) || '/functions/v1/fiken-invoice',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true)
            ),
            body := request_body
        ) INTO response_id;
        
        -- Log the request
        RAISE NOTICE 'Sent Fiken sync request for invoice % (request_id: %)', p_invoice_id, response_id;
        
        -- Note: We don't wait for the response here since pg_net is async
        -- The Edge Function will handle the Fiken API call and any errors
        -- In a production system, you might want to implement a callback mechanism
        
    EXCEPTION WHEN OTHERS THEN
        -- Log error but don't fail the entire transaction
        RAISE NOTICE 'Error sending Fiken sync request for invoice %: %', p_invoice_id, SQLERRM;
    END;
END;
$$;

-- =====================================================================================
-- CONFIGURATION SETTINGS
-- =====================================================================================

-- Set default Supabase URL and anon key if not already set
-- These should be configured in your Supabase project settings
DO $$
BEGIN
    -- Only set if not already configured
    IF current_setting('app.supabase_url', true) IS NULL THEN
        PERFORM set_config('app.supabase_url', 'https://kpgcobxdqxjjbzjfqgzl.supabase.co', false);
    END IF;
    
    -- Note: The anon key should be set via Supabase dashboard for security
    -- This is just a placeholder - replace with your actual anon key
    IF current_setting('app.supabase_anon_key', true) IS NULL THEN
        RAISE NOTICE 'Please set app.supabase_anon_key in your Supabase project settings';
    END IF;
END;
$$;

-- =====================================================================================
-- COMMENTS
-- =====================================================================================

COMMENT ON FUNCTION sync_draft_to_fiken(UUID) IS 'Enhanced: Syncs Supabase draft invoice to Fiken via pg_net and Edge Function';

-- =====================================================================================
-- TEST EXISTING DRAFTS AGAIN
-- =====================================================================================

-- Re-sync existing drafts with the fixed function
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
        LIMIT 3 -- Limit to 3 for testing
    LOOP
        PERFORM sync_draft_to_fiken(draft_record.id);
    END LOOP;
    
    RAISE NOTICE 'Re-synced existing drafts with fixed HTTP function';
END;
$$;
