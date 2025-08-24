-- =====================================================================================
-- SETUP FIKEN WEBHOOK SYSTEM
-- =====================================================================================
-- 
-- Creates a bulletproof webhook-based system for automatic Fiken sync
-- No manual buttons, no polling - just automatic invoice creation

-- =====================================================================================
-- WEBHOOK PAYLOAD FUNCTION
-- =====================================================================================

-- Function to prepare webhook payload for Fiken sync
CREATE OR REPLACE FUNCTION prepare_fiken_webhook_payload(p_invoice_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    invoice_record RECORD;
    customer_record RECORD;
    payload JSONB;
BEGIN
    -- Get invoice details with project and customer info
    SELECT i.*, p.name as project_name, p.customer_id
    INTO invoice_record
    FROM invoices i
    JOIN projects p ON p.id = i.project_id
    WHERE i.id = p_invoice_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Invoice not found');
    END IF;
    
    -- Skip if not an auto-draft
    IF NOT invoice_record.is_auto_draft OR invoice_record.status != 'draft' THEN
        RETURN json_build_object('error', 'Not an auto-draft invoice');
    END IF;
    
    -- Skip if no customer
    IF invoice_record.customer_id IS NULL THEN
        RETURN json_build_object('error', 'No customer for invoice');
    END IF;
    
    -- Get customer details
    SELECT * INTO customer_record
    FROM customers
    WHERE id = invoice_record.customer_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Customer not found');
    END IF;
    
    -- Skip if customer has no Fiken ID
    IF customer_record.fiken_customer_id IS NULL THEN
        RETURN json_build_object('error', 'Customer has no Fiken ID');
    END IF;
    
    -- Only sync if invoice has events (line items)
    IF invoice_record.total_amount <= 0 THEN
        RETURN json_build_object('error', 'Invoice has no amount');
    END IF;
    
    -- Build webhook payload
    payload := json_build_object(
        'action', 'create_or_update_draft',
        'invoice_id', p_invoice_id,
        'project_name', invoice_record.project_name,
        'customer_fiken_id', customer_record.fiken_customer_id,
        'total_amount', invoice_record.total_amount,
        'due_date', (invoice_record.due_date)::text,
        'webhook_trigger', true
    );
    
    RETURN payload;
END;
$$;

-- =====================================================================================
-- WEBHOOK TRIGGER FUNCTION
-- =====================================================================================

-- Function to trigger webhook when invoice needs Fiken sync
CREATE OR REPLACE FUNCTION trigger_fiken_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    webhook_payload JSONB;
    webhook_url TEXT;
BEGIN
    -- Only process invoices that need Fiken sync
    IF NEW.needs_fiken_sync = true AND (OLD.needs_fiken_sync IS NULL OR OLD.needs_fiken_sync = false) THEN
        
        -- Prepare webhook payload
        webhook_payload := prepare_fiken_webhook_payload(NEW.id);
        
        -- Check if payload is valid (no error)
        IF webhook_payload->>'error' IS NOT NULL THEN
            RAISE NOTICE 'Skipping Fiken webhook for invoice %: %', NEW.id, webhook_payload->>'error';
            RETURN NEW;
        END IF;
        
        -- Get the webhook URL (Edge Function endpoint)
        -- This will be set via environment or configuration
        webhook_url := current_setting('app.fiken_webhook_url', true);
        
        IF webhook_url IS NULL OR webhook_url = '' THEN
            -- Fallback to constructing the URL
            webhook_url := current_setting('app.supabase_url', true) || '/functions/v1/fiken-invoice';
        END IF;
        
        IF webhook_url IS NOT NULL AND webhook_url != '' THEN
            BEGIN
                -- Use pg_net to make async HTTP request
                PERFORM net.http_post(
                    url := webhook_url,
                    headers := jsonb_build_object(
                        'Content-Type', 'application/json',
                        'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true),
                        'X-Webhook-Source', 'supabase-trigger'
                    ),
                    body := webhook_payload
                );
                
                RAISE NOTICE 'Triggered Fiken webhook for invoice %', NEW.id;
                
            EXCEPTION WHEN OTHERS THEN
                -- Log error but don't fail the transaction
                RAISE NOTICE 'Error triggering Fiken webhook for invoice %: %', NEW.id, SQLERRM;
            END;
        ELSE
            RAISE NOTICE 'Fiken webhook URL not configured, skipping sync for invoice %', NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- =====================================================================================
-- WEBHOOK TRIGGER SETUP
-- =====================================================================================

-- Drop existing webhook trigger if it exists
DROP TRIGGER IF EXISTS fiken_webhook_trigger ON invoices;

-- Create webhook trigger
CREATE TRIGGER fiken_webhook_trigger
    AFTER UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION trigger_fiken_webhook();

-- =====================================================================================
-- CONFIGURATION SETUP
-- =====================================================================================

-- Set up configuration for webhook URL
-- Note: These will need to be set properly in production
DO $$
BEGIN
    -- Try to set the webhook configuration
    -- This might fail due to permissions, which is fine
    BEGIN
        PERFORM set_config('app.supabase_url', 'https://dlspsnjhpmzwxfjajsoa.supabase.co', false);
        PERFORM set_config('app.fiken_webhook_url', 'https://dlspsnjhpmzwxfjajsoa.supabase.co/functions/v1/fiken-invoice', false);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not set webhook configuration (this is normal): %', SQLERRM;
    END;
END;
$$;

-- =====================================================================================
-- ENHANCED SYNC TRACKING
-- =====================================================================================

-- Add webhook attempt tracking
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS fiken_webhook_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fiken_last_webhook_at TIMESTAMPTZ;

-- Function to track webhook attempts
CREATE OR REPLACE FUNCTION track_fiken_webhook_attempt(p_invoice_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE invoices
    SET 
        fiken_webhook_attempts = COALESCE(fiken_webhook_attempts, 0) + 1,
        fiken_last_webhook_at = NOW(),
        updated_at = NOW()
    WHERE id = p_invoice_id;
END;
$$;

-- =====================================================================================
-- COMMENTS
-- =====================================================================================

COMMENT ON FUNCTION prepare_fiken_webhook_payload(UUID) IS 'Prepares webhook payload for Fiken sync with validation';
COMMENT ON FUNCTION trigger_fiken_webhook() IS 'Trigger function that sends webhook to Fiken Edge Function';
COMMENT ON FUNCTION track_fiken_webhook_attempt(UUID) IS 'Tracks webhook attempts for debugging';

COMMENT ON COLUMN invoices.fiken_webhook_attempts IS 'Number of webhook attempts for this invoice';
COMMENT ON COLUMN invoices.fiken_last_webhook_at IS 'Timestamp of last webhook attempt';

-- =====================================================================================
-- TEST WEBHOOK SYSTEM
-- =====================================================================================

-- Test the webhook payload function
DO $$
DECLARE
    test_payload JSONB;
    test_invoice_id UUID;
BEGIN
    -- Get a test invoice ID
    SELECT id INTO test_invoice_id
    FROM invoices
    WHERE is_auto_draft = true
    LIMIT 1;
    
    IF test_invoice_id IS NOT NULL THEN
        test_payload := prepare_fiken_webhook_payload(test_invoice_id);
        RAISE NOTICE 'Test webhook payload: %', test_payload;
    ELSE
        RAISE NOTICE 'No test invoice found for webhook testing';
    END IF;
END;
$$;
