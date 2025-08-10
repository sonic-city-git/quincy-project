-- Fix the get_equipment_virtual_stock function return type mismatch
-- The function returns numeric types but is declared to return integers

-- Drop the existing function
DROP FUNCTION IF EXISTS get_equipment_virtual_stock(uuid[], date, date);

-- Recreate with correct return types
CREATE OR REPLACE FUNCTION get_equipment_virtual_stock(
    equipment_ids uuid[],
    start_date date,
    end_date date
) RETURNS TABLE (
    equipment_id uuid,
    equipment_name text,
    date date,
    base_stock integer,           -- Changed to integer to match equipment.stock
    virtual_additions bigint,     -- Keep as bigint for SUM results  
    virtual_reductions bigint,    -- Keep as bigint for SUM results
    effective_stock bigint        -- Keep as bigint for calculated results
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
            WHEN equipment_ids IS NOT NULL AND array_length(equipment_ids, 1) > 0 
            THEN e.id = ANY(equipment_ids)
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
          AND (equipment_ids IS NULL OR array_length(equipment_ids, 1) = 0 OR soi.equipment_id = ANY(equipment_ids))
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
          AND (equipment_ids IS NULL OR array_length(equipment_ids, 1) = 0 OR roi.equipment_id = ANY(equipment_ids))
        GROUP BY roi.equipment_id, dr.calc_date
    )
    SELECT 
        fe.id,
        fe.name,
        dr.calc_date,
        fe.stock::integer,                                                    -- Ensure integer type
        COALESCE(sc.additions, 0)::bigint,                                   -- Cast to bigint
        COALESCE(rc.reductions, 0)::bigint,                                  -- Cast to bigint
        (fe.stock + COALESCE(sc.additions, 0) - COALESCE(rc.reductions, 0))::bigint  -- Cast to bigint
    FROM filtered_equipment fe
    CROSS JOIN date_range dr
    LEFT JOIN subrental_contributions sc ON fe.id = sc.equipment_id AND dr.calc_date = sc.calc_date
    LEFT JOIN repair_contributions rc ON fe.id = rc.equipment_id AND dr.calc_date = rc.calc_date
    ORDER BY fe.id, dr.calc_date;
END;
$$ LANGUAGE plpgsql STABLE;
