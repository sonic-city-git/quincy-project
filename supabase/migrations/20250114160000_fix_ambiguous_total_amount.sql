-- =====================================================================================
-- FIX AMBIGUOUS TOTAL_AMOUNT COLUMN REFERENCE
-- =====================================================================================
-- 
-- The update_draft_invoice_total function has a variable named 'total_amount'
-- that conflicts with the column name in the UPDATE statement.
-- This fixes the ambiguous column reference error.

-- =====================================================================================
-- FIX UPDATE_DRAFT_INVOICE_TOTAL FUNCTION
-- =====================================================================================

CREATE OR REPLACE FUNCTION update_draft_invoice_total(p_invoice_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    calculated_total DECIMAL(10,2);  -- Renamed from total_amount to avoid conflict
BEGIN
    -- Calculate total from line items (not events)
    SELECT COALESCE(SUM(line_total), 0)
    INTO calculated_total
    FROM invoice_line_items
    WHERE invoice_id = p_invoice_id;
    
    -- Update invoice total with explicit column reference
    UPDATE invoices
    SET 
        invoices.total_amount = calculated_total,  -- Explicit table reference
        invoices.updated_at = NOW()
    WHERE invoices.id = p_invoice_id;
    
    RAISE NOTICE 'Updated invoice % total to %', p_invoice_id, calculated_total;
END;
$$;

-- =====================================================================================
-- ALSO FIX SYNC_DRAFT_TO_FIKEN FUNCTION
-- =====================================================================================

-- Make sure this function also uses proper column references
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
    
    -- Only sync if invoice has events (line items) - use explicit column reference
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
        'total_amount', invoice_record.total_amount,  -- Explicit record reference
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
        
    EXCEPTION WHEN OTHERS THEN
        -- Log error but don't fail the entire transaction
        RAISE NOTICE 'Error sending Fiken sync request for invoice %: %', p_invoice_id, SQLERRM;
    END;
END;
$$;

-- =====================================================================================
-- COMMENTS
-- =====================================================================================

COMMENT ON FUNCTION update_draft_invoice_total(UUID) IS 'Fixed: Renamed variable to avoid ambiguous column reference';
COMMENT ON FUNCTION sync_draft_to_fiken(UUID) IS 'Fixed: Uses explicit record references for total_amount';
