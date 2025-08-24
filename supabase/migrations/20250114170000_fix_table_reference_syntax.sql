-- =====================================================================================
-- FIX TABLE REFERENCE SYNTAX IN UPDATE STATEMENT
-- =====================================================================================
-- 
-- The previous fix used incorrect syntax: invoices.total_amount in UPDATE SET clause
-- PostgreSQL doesn't allow table prefixes in the SET clause of UPDATE statements
-- This fixes the syntax error.

-- =====================================================================================
-- FIX UPDATE_DRAFT_INVOICE_TOTAL FUNCTION
-- =====================================================================================

CREATE OR REPLACE FUNCTION update_draft_invoice_total(p_invoice_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    calculated_total DECIMAL(10,2);  -- Renamed variable to avoid conflict
BEGIN
    -- Calculate total from line items
    SELECT COALESCE(SUM(line_total), 0)
    INTO calculated_total
    FROM invoice_line_items
    WHERE invoice_id = p_invoice_id;
    
    -- Update invoice total (no table prefix in SET clause)
    UPDATE invoices
    SET 
        total_amount = calculated_total,  -- Correct: no table prefix
        updated_at = NOW()
    WHERE id = p_invoice_id;
    
    RAISE NOTICE 'Updated invoice % total to %', p_invoice_id, calculated_total;
END;
$$;

-- =====================================================================================
-- COMMENTS
-- =====================================================================================

COMMENT ON FUNCTION update_draft_invoice_total(UUID) IS 'Fixed: Correct UPDATE syntax without table prefix in SET clause';
