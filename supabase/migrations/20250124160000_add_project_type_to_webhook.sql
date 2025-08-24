-- =====================================================================================
-- ADD PROJECT TYPE TO WEBHOOK PAYLOAD
-- =====================================================================================
-- 
-- Updates the webhook system to include project type for VAT calculation

-- Update the webhook payload function to include project type
CREATE OR REPLACE FUNCTION prepare_fiken_webhook_payload(p_invoice_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    invoice_record RECORD;
    customer_record RECORD;
    payload JSONB;
BEGIN
    -- Get invoice details with project and customer info including project type
    SELECT i.*, p.name as project_name, pt.name as project_type, p.customer_id
    INTO invoice_record
    FROM invoices i
    JOIN projects p ON p.id = i.project_id
    LEFT JOIN project_types pt ON p.project_type_id = pt.id
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
    
    -- Build webhook payload with project type
    payload := json_build_object(
        'action', 'create_or_update_draft',
        'invoice_id', p_invoice_id,
        'project_name', invoice_record.project_name,
        'project_type', invoice_record.project_type,
        'customer_fiken_id', customer_record.fiken_customer_id,
        'total_amount', invoice_record.total_amount,
        'due_date', (invoice_record.due_date)::text,
        'webhook_trigger', true
    );
    
    RETURN payload;
END;
$$;

-- Test function to manually trigger webhook
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
    
    -- Check if payload is valid (no error)
    IF webhook_payload->>'error' IS NOT NULL THEN
        RETURN json_build_object('error', webhook_payload->>'error');
    END IF;
    
    -- Get the webhook URL
    webhook_url := current_setting('app.fiken_webhook_url', true);
    
    IF webhook_url IS NULL OR webhook_url = '' THEN
        webhook_url := current_setting('app.supabase_url', true) || '/functions/v1/fiken-invoice';
    END IF;
    
    -- Make HTTP request
    SELECT net.http_post(
        url := webhook_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true),
            'X-Webhook-Source', 'supabase-trigger'
        ),
        body := webhook_payload
    ) INTO response_id;
    
    RETURN json_build_object(
        'success', true,
        'payload', webhook_payload,
        'response_id', response_id,
        'webhook_url', webhook_url
    );
END;
$$;
