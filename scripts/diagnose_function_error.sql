-- Diagnose the get_equipment_virtual_stock function error

-- 1. Check if the function exists
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'get_equipment_virtual_stock';

-- 2. Check function parameters
SELECT 
    parameter_name,
    data_type,
    parameter_mode
FROM information_schema.parameters 
WHERE specific_name IN (
    SELECT specific_name 
    FROM information_schema.routines 
    WHERE routine_name = 'get_equipment_virtual_stock'
);

-- 3. Test function with minimal data
SELECT * FROM get_equipment_virtual_stock(
    ARRAY[]::uuid[],  -- Empty array
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 day'
) LIMIT 1;

-- 4. Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('subrental_orders', 'subrental_order_items', 'equipment')
AND table_schema = 'public';

-- 5. Get sample equipment ID for testing
SELECT id, name, stock 
FROM equipment 
LIMIT 1;
