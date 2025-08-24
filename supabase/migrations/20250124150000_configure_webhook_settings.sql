-- =====================================================================================
-- CONFIGURE WEBHOOK SETTINGS
-- =====================================================================================
-- 
-- Sets up the proper configuration for webhook system to work

-- =====================================================================================
-- SET CONFIGURATION VALUES
-- =====================================================================================

-- Set the configuration values for the current session
-- These need to be set at the database level for triggers to access them
SELECT set_config('app.supabase_url', 'https://dlspsnjhpmzwxfjajsoa.supabase.co', false);
SELECT set_config('app.supabase_anon_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsc3BzbmpocG16d3hmamFqc29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyMzg4MDYsImV4cCI6MjA1MTgxNDgwNn0.qpGbi5uvotNyrzCpdWZb4u4w4WqJMclou_zuXEhpvzw', false);
SELECT set_config('app.fiken_webhook_url', 'https://dlspsnjhpmzwxfjajsoa.supabase.co/functions/v1/fiken-invoice', false);

-- =====================================================================================
-- TEST WEBHOOK CONFIGURATION
-- =====================================================================================

-- Test that we can access the configuration
DO $$
DECLARE
    supabase_url TEXT;
    anon_key TEXT;
    webhook_url TEXT;
BEGIN
    supabase_url := current_setting('app.supabase_url', true);
    anon_key := current_setting('app.supabase_anon_key', true);
    webhook_url := current_setting('app.fiken_webhook_url', true);
    
    RAISE NOTICE 'Webhook configuration test:';
    RAISE NOTICE 'Supabase URL: %', COALESCE(supabase_url, 'NOT SET');
    RAISE NOTICE 'Anon Key: %', CASE WHEN anon_key IS NOT NULL THEN 'SET (length: ' || length(anon_key) || ')' ELSE 'NOT SET' END;
    RAISE NOTICE 'Webhook URL: %', COALESCE(webhook_url, 'NOT SET');
END;
$$;

-- =====================================================================================
-- MANUAL TEST FUNCTION
-- =====================================================================================

-- Function to manually test the webhook system
CREATE OR REPLACE FUNCTION test_fiken_webhook(p_invoice_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    webhook_payload JSONB;
    webhook_url TEXT;
    response_id BIGINT;
BEGIN
    -- Prepare webhook payload
    webhook_payload := prepare_fiken_webhook_payload(p_invoice_id);
    
    -- Check if payload is valid
    IF webhook_payload->>'error' IS NOT NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', webhook_payload->>'error'
        );
    END IF;
    
    -- Get webhook URL
    webhook_url := current_setting('app.fiken_webhook_url', true);
    
    IF webhook_url IS NULL OR webhook_url = '' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Webhook URL not configured'
        );
    END IF;
    
    BEGIN
        -- Send webhook
        SELECT net.http_post(
            url := webhook_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true),
                'X-Webhook-Source', 'manual-test'
            ),
            body := webhook_payload
        ) INTO response_id;
        
        RETURN json_build_object(
            'success', true,
            'webhook_url', webhook_url,
            'payload', webhook_payload,
            'response_id', response_id
        );
        
    EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'webhook_url', webhook_url,
            'payload', webhook_payload
        );
    END;
END;
$$;

-- =====================================================================================
-- COMMENTS
-- =====================================================================================

COMMENT ON FUNCTION test_fiken_webhook(UUID) IS 'Manual test function for webhook system';

-- =====================================================================================
-- INSTRUCTIONS
-- =====================================================================================

-- To test the webhook system:
-- 1. SELECT test_fiken_webhook('your-invoice-id-here');
-- 2. Check the logs for webhook activity
-- 3. Verify the invoice gets updated with Fiken data
