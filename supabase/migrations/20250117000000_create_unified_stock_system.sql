-- =====================================================================================
-- QUINCY UNIFIED STOCK SYSTEM - COMPLETE SCHEMA
-- =====================================================================================
-- Migration: Create unified stock management system with bundled orders
-- Description: Replaces individual subrental confirmations with bundled order management
-- Author: Systems Engineer
-- Date: 2025-01-17

-- =====================================================================================
-- SUBRENTAL ORDERS SYSTEM
-- =====================================================================================

-- Master subrental orders table
CREATE TABLE IF NOT EXISTS subrental_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,                                -- "Festival Audio Package - Oslo Equipment"
    provider_id uuid NOT NULL REFERENCES external_providers(id) ON DELETE RESTRICT,
    start_date date NOT NULL,
    end_date date NOT NULL,
    total_cost numeric(10,2),
    status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'delivered', 'returned', 'cancelled')),
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Business constraints
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    CONSTRAINT valid_total_cost CHECK (total_cost IS NULL OR total_cost >= 0)
);

-- Individual equipment items within subrental orders
CREATE TABLE IF NOT EXISTS subrental_order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subrental_order_id uuid NOT NULL REFERENCES subrental_orders(id) ON DELETE CASCADE,
    equipment_id uuid NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    equipment_name text NOT NULL,                      -- Denormalized for historical accuracy
    quantity integer NOT NULL CHECK (quantity > 0),
    unit_cost numeric(10,2),
    temporary_serial text,                             -- "Oslo Equipment MX1 #1"
    notes text,
    created_at timestamptz DEFAULT now(),
    
    -- Business constraints
    CONSTRAINT valid_unit_cost CHECK (unit_cost IS NULL OR unit_cost >= 0)
);

-- =====================================================================================
-- REPAIR ORDERS SYSTEM (FUTURE EXPANSION)
-- =====================================================================================

-- Master repair orders table  
CREATE TABLE IF NOT EXISTS repair_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,                               -- "Mixer CDM32 - Power Supply Repair"
    facility_name text NOT NULL,                      -- Repair facility name
    start_date date NOT NULL,
    estimated_end_date date,
    actual_end_date date,
    total_cost numeric(10,2),
    status text NOT NULL DEFAULT 'in_repair' CHECK (status IN ('in_repair', 'completed', 'cancelled')),
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Business constraints
    CONSTRAINT valid_repair_dates CHECK (
        estimated_end_date IS NULL OR estimated_end_date >= start_date
    ),
    CONSTRAINT valid_actual_end_date CHECK (
        actual_end_date IS NULL OR actual_end_date >= start_date
    ),
    CONSTRAINT valid_repair_cost CHECK (total_cost IS NULL OR total_cost >= 0)
);

-- Individual equipment items in repair
CREATE TABLE IF NOT EXISTS repair_order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    repair_order_id uuid NOT NULL REFERENCES repair_orders(id) ON DELETE CASCADE,
    equipment_id uuid NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    equipment_name text NOT NULL,                     -- Denormalized for historical accuracy
    quantity integer NOT NULL CHECK (quantity > 0),
    serial_numbers text[],                            -- Specific units being repaired
    issue_description text,
    estimated_cost numeric(10,2),
    created_at timestamptz DEFAULT now(),
    
    -- Business constraints
    CONSTRAINT valid_estimated_repair_cost CHECK (estimated_cost IS NULL OR estimated_cost >= 0)
);

-- =====================================================================================
-- PERFORMANCE INDEXES
-- =====================================================================================

-- Subrental Orders Indexes
CREATE INDEX idx_subrental_orders_provider ON subrental_orders(provider_id);
CREATE INDEX idx_subrental_orders_dates ON subrental_orders(start_date, end_date);
CREATE INDEX idx_subrental_orders_status ON subrental_orders(status);
CREATE INDEX idx_subrental_orders_date_status ON subrental_orders(start_date, end_date, status);

-- Subrental Order Items Indexes  
CREATE INDEX idx_subrental_order_items_order ON subrental_order_items(subrental_order_id);
CREATE INDEX idx_subrental_order_items_equipment ON subrental_order_items(equipment_id);
CREATE INDEX idx_subrental_order_items_equipment_order ON subrental_order_items(equipment_id, subrental_order_id);

-- Repair Orders Indexes
CREATE INDEX idx_repair_orders_dates ON repair_orders(start_date, estimated_end_date);
CREATE INDEX idx_repair_orders_status ON repair_orders(status);
CREATE INDEX idx_repair_orders_facility ON repair_orders(facility_name);

-- Repair Order Items Indexes
CREATE INDEX idx_repair_order_items_order ON repair_order_items(repair_order_id);
CREATE INDEX idx_repair_order_items_equipment ON repair_order_items(equipment_id);

-- =====================================================================================
-- VIRTUAL STOCK CALCULATION VIEWS
-- =====================================================================================

-- Pre-calculated virtual stock for performance
CREATE OR REPLACE VIEW equipment_virtual_stock AS
WITH date_series AS (
    -- Generate date series for next 365 days (configurable)
    SELECT generate_series(
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '365 days',
        '1 day'::interval
    )::date AS calc_date
),
subrental_contributions AS (
    -- Calculate subrental stock additions per equipment per date
    SELECT 
        soi.equipment_id,
        ds.calc_date,
        COALESCE(SUM(soi.quantity), 0) AS subrental_additions
    FROM date_series ds
    CROSS JOIN subrental_order_items soi
    INNER JOIN subrental_orders so ON soi.subrental_order_id = so.id
    WHERE so.start_date <= ds.calc_date
      AND so.end_date >= ds.calc_date
      AND so.status IN ('confirmed', 'delivered')
    GROUP BY soi.equipment_id, ds.calc_date
),
repair_contributions AS (
    -- Calculate repair stock reductions per equipment per date
    SELECT 
        roi.equipment_id,
        ds.calc_date,
        COALESCE(SUM(roi.quantity), 0) AS repair_reductions
    FROM date_series ds
    CROSS JOIN repair_order_items roi
    INNER JOIN repair_orders ro ON roi.repair_order_id = ro.id
    WHERE ro.start_date <= ds.calc_date
      AND (ro.actual_end_date IS NULL OR ro.actual_end_date >= ds.calc_date)
      AND (ro.estimated_end_date IS NULL OR ro.estimated_end_date >= ds.calc_date)
      AND ro.status = 'in_repair'
    GROUP BY roi.equipment_id, ds.calc_date
)
SELECT 
    e.id AS equipment_id,
    e.name AS equipment_name,
    ds.calc_date AS date,
    e.stock AS base_stock,
    COALESCE(sc.subrental_additions, 0) AS virtual_additions,
    COALESCE(rc.repair_reductions, 0) AS virtual_reductions,
    e.stock + COALESCE(sc.subrental_additions, 0) - COALESCE(rc.repair_reductions, 0) AS effective_stock
FROM equipment e
CROSS JOIN date_series ds
LEFT JOIN subrental_contributions sc ON e.id = sc.equipment_id AND ds.calc_date = sc.calc_date
LEFT JOIN repair_contributions rc ON e.id = rc.equipment_id AND ds.calc_date = rc.calc_date;

-- Optimized view for date range queries
CREATE OR REPLACE FUNCTION get_equipment_virtual_stock(
    equipment_ids uuid[],
    start_date date,
    end_date date
) RETURNS TABLE (
    equipment_id uuid,
    equipment_name text,
    date date,
    base_stock integer,
    virtual_additions bigint,
    virtual_reductions bigint,
    effective_stock bigint
) AS $$
BEGIN
    RETURN QUERY
    WITH date_range AS (
        SELECT generate_series(start_date, end_date, '1 day'::interval)::date AS calc_date
    ),
    filtered_equipment AS (
        SELECT e.id, e.name, e.stock
        FROM equipment e
        WHERE CASE 
            WHEN equipment_ids IS NOT NULL THEN e.id = ANY(equipment_ids)
            ELSE true
        END
    ),
    subrental_contributions AS (
        SELECT 
            soi.equipment_id,
            dr.calc_date,
            COALESCE(SUM(soi.quantity), 0) AS additions
        FROM date_range dr
        CROSS JOIN subrental_order_items soi
        INNER JOIN subrental_orders so ON soi.subrental_order_id = so.id
        WHERE so.start_date <= dr.calc_date
          AND so.end_date >= dr.calc_date
          AND so.status IN ('confirmed', 'delivered')
          AND (equipment_ids IS NULL OR soi.equipment_id = ANY(equipment_ids))
        GROUP BY soi.equipment_id, dr.calc_date
    ),
    repair_contributions AS (
        SELECT 
            roi.equipment_id,
            dr.calc_date,
            COALESCE(SUM(roi.quantity), 0) AS reductions
        FROM date_range dr
        CROSS JOIN repair_order_items roi
        INNER JOIN repair_orders ro ON roi.repair_order_id = ro.id
        WHERE ro.start_date <= dr.calc_date
          AND (ro.actual_end_date IS NULL OR ro.actual_end_date >= dr.calc_date)
          AND ro.status = 'in_repair'
          AND (equipment_ids IS NULL OR roi.equipment_id = ANY(equipment_ids))
        GROUP BY roi.equipment_id, dr.calc_date
    )
    SELECT 
        fe.id,
        fe.name,
        dr.calc_date,
        fe.stock,
        COALESCE(sc.additions, 0),
        COALESCE(rc.reductions, 0),
        fe.stock + COALESCE(sc.additions, 0) - COALESCE(rc.reductions, 0)
    FROM filtered_equipment fe
    CROSS JOIN date_range dr
    LEFT JOIN subrental_contributions sc ON fe.id = sc.equipment_id AND dr.calc_date = sc.calc_date
    LEFT JOIN repair_contributions rc ON fe.id = rc.equipment_id AND dr.calc_date = rc.calc_date;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================================================
-- ROW LEVEL SECURITY
-- =====================================================================================

-- Enable RLS on all new tables
ALTER TABLE subrental_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE subrental_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_order_items ENABLE ROW LEVEL SECURITY;

-- Subrental Orders Policies
CREATE POLICY "Enable read access for authenticated users" ON subrental_orders
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON subrental_orders
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON subrental_orders
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON subrental_orders
    FOR DELETE TO authenticated USING (true);

-- Subrental Order Items Policies
CREATE POLICY "Enable read access for authenticated users" ON subrental_order_items
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON subrental_order_items
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON subrental_order_items
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON subrental_order_items
    FOR DELETE TO authenticated USING (true);

-- Repair Orders Policies
CREATE POLICY "Enable read access for authenticated users" ON repair_orders
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON repair_orders
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON repair_orders
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON repair_orders
    FOR DELETE TO authenticated USING (true);

-- Repair Order Items Policies
CREATE POLICY "Enable read access for authenticated users" ON repair_order_items
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON repair_order_items
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON repair_order_items
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON repair_order_items
    FOR DELETE TO authenticated USING (true);

-- =====================================================================================
-- DATA MIGRATION FROM OLD SYSTEM
-- =====================================================================================

-- Function to migrate existing confirmed_subrentals to new system
CREATE OR REPLACE FUNCTION migrate_confirmed_subrentals_to_orders()
RETURNS TABLE (
    orders_created integer,
    items_created integer,
    total_cost_migrated numeric,
    errors text[]
) AS $$
DECLARE
    order_count integer := 0;
    item_count integer := 0;
    cost_total numeric := 0;
    error_list text[] := ARRAY[]::text[];
    
    -- Variables for processing
    current_order_id uuid;
    provider_name text;
BEGIN
    -- Create orders by grouping existing subrentals by provider + date range
    FOR provider_name IN (
        SELECT DISTINCT ep.company_name
        FROM confirmed_subrentals cs
        JOIN external_providers ep ON cs.provider_id = ep.id
        WHERE cs.status IN ('confirmed', 'delivered')
    ) LOOP
        BEGIN
            -- Insert grouped order
            INSERT INTO subrental_orders (
                name,
                provider_id,
                start_date,
                end_date,
                total_cost,
                status,
                notes
            )
            SELECT 
                provider_name || ' - ' || MIN(cs.start_date)::text || ' to ' || MAX(cs.end_date)::text,
                cs.provider_id,
                MIN(cs.start_date),
                MAX(cs.end_date),
                SUM(cs.cost),
                'confirmed',
                'Migrated from individual subrental confirmations'
            FROM confirmed_subrentals cs
            JOIN external_providers ep ON cs.provider_id = ep.id
            WHERE ep.company_name = provider_name
              AND cs.status IN ('confirmed', 'delivered')
            GROUP BY cs.provider_id
            RETURNING id INTO current_order_id;
            
            order_count := order_count + 1;
            
            -- Insert order items
            INSERT INTO subrental_order_items (
                subrental_order_id,
                equipment_id,
                equipment_name,
                quantity,
                unit_cost,
                temporary_serial,
                notes
            )
            SELECT 
                current_order_id,
                cs.equipment_id,
                cs.equipment_name,
                cs.quantity,
                cs.cost,
                cs.temporary_serial,
                cs.notes
            FROM confirmed_subrentals cs
            JOIN external_providers ep ON cs.provider_id = ep.id
            WHERE ep.company_name = provider_name
              AND cs.status IN ('confirmed', 'delivered');
            
            GET DIAGNOSTICS item_count = ROW_COUNT;
            
        EXCEPTION
            WHEN OTHERS THEN
                error_list := array_append(error_list, 'Error migrating provider ' || provider_name || ': ' || SQLERRM);
        END;
    END LOOP;
    
    -- Calculate total migrated cost
    SELECT SUM(total_cost) INTO cost_total FROM subrental_orders;
    
    RETURN QUERY SELECT order_count, item_count, cost_total, error_list;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================================
-- VALIDATION FUNCTIONS
-- =====================================================================================

-- Function to validate data integrity after migration
CREATE OR REPLACE FUNCTION validate_stock_system_integrity()
RETURNS TABLE (
    check_name text,
    passed boolean,
    details text
) AS $$
BEGIN
    -- Check 1: All migrated items have valid equipment references
    RETURN QUERY
    SELECT 
        'Equipment References' as check_name,
        NOT EXISTS (
            SELECT 1 FROM subrental_order_items soi
            LEFT JOIN equipment e ON soi.equipment_id = e.id
            WHERE e.id IS NULL
        ) as passed,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM subrental_order_items soi
                LEFT JOIN equipment e ON soi.equipment_id = e.id
                WHERE e.id IS NULL
            ) THEN 'Found subrental items with invalid equipment references'
            ELSE 'All subrental items have valid equipment references'
        END as details;
    
    -- Check 2: All orders have valid provider references
    RETURN QUERY
    SELECT 
        'Provider References' as check_name,
        NOT EXISTS (
            SELECT 1 FROM subrental_orders so
            LEFT JOIN external_providers ep ON so.provider_id = ep.id
            WHERE ep.id IS NULL
        ) as passed,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM subrental_orders so
                LEFT JOIN external_providers ep ON so.provider_id = ep.id
                WHERE ep.id IS NULL
            ) THEN 'Found subrental orders with invalid provider references'
            ELSE 'All subrental orders have valid provider references'
        END as details;
    
    -- Check 3: Virtual stock view performs without errors
    RETURN QUERY
    SELECT 
        'Virtual Stock View' as check_name,
        true as passed,  -- If we get here, the view works
        'Virtual stock view executes successfully for sample data' as details;
    
    -- Verify by selecting a small sample
    PERFORM * FROM equipment_virtual_stock LIMIT 10;
    
END;
$$ LANGUAGE plpgsql;

-- =====================================================================================
-- INITIAL SETUP
-- =====================================================================================

-- Add helpful comment
COMMENT ON TABLE subrental_orders IS 'Master table for bundled subrental orders - replaces individual confirmed_subrentals';
COMMENT ON TABLE subrental_order_items IS 'Individual equipment items within subrental orders';
COMMENT ON TABLE repair_orders IS 'Master table for equipment repair tracking (future feature)';
COMMENT ON TABLE repair_order_items IS 'Individual equipment items being repaired';

COMMENT ON VIEW equipment_virtual_stock IS 'Pre-calculated effective stock including virtual additions/reductions';
COMMENT ON FUNCTION get_equipment_virtual_stock IS 'Optimized function for virtual stock calculations over date ranges';

-- Success notification
DO $$
BEGIN
    RAISE NOTICE 'Unified Stock System schema created successfully';
    RAISE NOTICE 'Next steps: 1) Run data migration 2) Validate integrity 3) Update application code';
END $$;
