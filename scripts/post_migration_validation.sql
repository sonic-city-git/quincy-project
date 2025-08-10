-- =====================================================================================
-- POST-MIGRATION VALIDATION SCRIPT
-- =====================================================================================
-- Validates the new unified stock system after migration

DO $$
BEGIN
    RAISE NOTICE '🔍 STARTING POST-MIGRATION VALIDATION';
    RAISE NOTICE '==========================================';
END $$;

-- Check 1: New tables created
SELECT 
    schemaname,
    tablename,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename IN (
    'subrental_orders',
    'subrental_order_items', 
    'repair_orders',
    'repair_order_items'
)
ORDER BY tablename;

-- Check 2: Views created
SELECT 
    schemaname,
    viewname,
    definition IS NOT NULL as has_definition
FROM pg_views 
WHERE viewname IN ('equipment_virtual_stock');

-- Check 3: Functions created
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name IN (
    'get_equipment_virtual_stock',
    'migrate_confirmed_subrentals_to_orders',
    'validate_stock_system_integrity'
)
ORDER BY routine_name;

-- Check 4: Indexes created
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE indexname LIKE 'idx_subrental%' OR indexname LIKE 'idx_repair%'
ORDER BY tablename, indexname;

-- Check 5: RLS policies created
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename IN (
    'subrental_orders',
    'subrental_order_items',
    'repair_orders', 
    'repair_order_items'
)
ORDER BY tablename, policyname;

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ POST-MIGRATION VALIDATION COMPLETE';
    RAISE NOTICE 'Review table and function creation above';
END $$;
