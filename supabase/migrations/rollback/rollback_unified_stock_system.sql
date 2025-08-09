-- =====================================================================================
-- ROLLBACK SCRIPT: UNIFIED STOCK SYSTEM
-- =====================================================================================
-- Emergency rollback from unified stock system back to confirmed_subrentals
-- Use only if critical issues found during migration

-- =====================================================================================
-- RESTORE CONFIRMED_SUBRENTALS FROM SUBRENTAL_ORDERS
-- =====================================================================================

-- Recreate confirmed_subrentals table with original structure
CREATE TABLE IF NOT EXISTS confirmed_subrentals_restored (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id uuid NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    equipment_name text NOT NULL,
    provider_id uuid NOT NULL REFERENCES external_providers(id) ON DELETE RESTRICT,
    start_date date NOT NULL,
    end_date date NOT NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    cost numeric(10,2),
    temporary_serial text,
    notes text,
    status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'delivered', 'returned', 'cancelled')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Migrate data back from subrental orders to individual confirmations
INSERT INTO confirmed_subrentals_restored (
    equipment_id,
    equipment_name,
    provider_id,
    start_date,
    end_date,
    quantity,
    cost,
    temporary_serial,
    notes,
    status,
    created_at
)
SELECT 
    soi.equipment_id,
    soi.equipment_name,
    so.provider_id,
    so.start_date,
    so.end_date,
    soi.quantity,
    soi.unit_cost,
    soi.temporary_serial,
    COALESCE(soi.notes, so.notes),
    so.status,
    so.created_at
FROM subrental_order_items soi
JOIN subrental_orders so ON soi.subrental_order_id = so.id;

-- Validate data integrity
DO $$
DECLARE
    original_count integer;
    restored_count integer;
BEGIN
    -- Count original items
    SELECT COUNT(*) INTO restored_count FROM confirmed_subrentals_restored;
    
    -- Compare with subrental items
    SELECT COUNT(*) INTO original_count FROM subrental_order_items;
    
    IF restored_count != original_count THEN
        RAISE EXCEPTION 'Data integrity check failed: % items restored vs % original items', 
            restored_count, original_count;
    END IF;
    
    RAISE NOTICE 'Rollback data validation successful: % items restored', restored_count;
END $$;

-- =====================================================================================
-- CLEANUP NEW SYSTEM (DANGEROUS - ONLY IF CONFIRMED)
-- =====================================================================================

-- Uncomment these lines only if you're certain about the rollback:

-- DROP VIEW IF EXISTS equipment_virtual_stock CASCADE;
-- DROP FUNCTION IF EXISTS get_equipment_virtual_stock CASCADE;
-- DROP FUNCTION IF EXISTS migrate_confirmed_subrentals_to_orders CASCADE;
-- DROP FUNCTION IF EXISTS validate_stock_system_integrity CASCADE;

-- DROP TABLE IF EXISTS repair_order_items CASCADE;
-- DROP TABLE IF EXISTS repair_orders CASCADE;
-- DROP TABLE IF EXISTS subrental_order_items CASCADE;
-- DROP TABLE IF EXISTS subrental_orders CASCADE;

-- =====================================================================================
-- RENAME RESTORED TABLE (FINAL STEP)
-- =====================================================================================

-- Only execute this after confirming the rollback is working:
-- ALTER TABLE confirmed_subrentals_restored RENAME TO confirmed_subrentals;

-- Recreate original indexes
-- CREATE INDEX idx_confirmed_subrentals_equipment_id ON confirmed_subrentals(equipment_id);
-- CREATE INDEX idx_confirmed_subrentals_provider_id ON confirmed_subrentals(provider_id);
-- CREATE INDEX idx_confirmed_subrentals_dates ON confirmed_subrentals(start_date, end_date);
-- CREATE INDEX idx_confirmed_subrentals_status ON confirmed_subrentals(status);

-- Recreate RLS policies
-- ALTER TABLE confirmed_subrentals ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable read access for authenticated users" ON confirmed_subrentals FOR SELECT TO authenticated USING (true);
-- CREATE POLICY "Enable insert for authenticated users" ON confirmed_subrentals FOR INSERT TO authenticated WITH CHECK (true);
-- CREATE POLICY "Enable update for authenticated users" ON confirmed_subrentals FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- CREATE POLICY "Enable delete for authenticated users" ON confirmed_subrentals FOR DELETE TO authenticated USING (true);

RAISE NOTICE 'Rollback preparation complete. Review data in confirmed_subrentals_restored table before proceeding with cleanup.';
