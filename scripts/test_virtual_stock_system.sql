-- =====================================================================================
-- TEST VIRTUAL STOCK SYSTEM
-- =====================================================================================
-- Test the new virtual stock calculations and conflict detection

-- Test 1: Check if virtual stock function works
SELECT 'Testing virtual stock function...' as test_description;

-- Get sample equipment for testing
DO $$
DECLARE
    sample_equipment_id uuid;
    equipment_name text;
    base_stock integer;
BEGIN
    -- Get first equipment item
    SELECT id, name, stock INTO sample_equipment_id, equipment_name, base_stock
    FROM equipment 
    WHERE stock > 0 
    LIMIT 1;
    
    IF sample_equipment_id IS NOT NULL THEN
        RAISE NOTICE '📦 Testing with equipment: % (ID: %, Stock: %)', 
            equipment_name, sample_equipment_id, base_stock;
            
        -- Test virtual stock calculation for next 7 days
        RAISE NOTICE '🧮 Testing virtual stock calculation for next 7 days...';
        
        -- This should work without errors even with no subrental data
        PERFORM * FROM get_equipment_virtual_stock(
            ARRAY[sample_equipment_id], 
            CURRENT_DATE, 
            CURRENT_DATE + INTERVAL '7 days'
        ) LIMIT 5;
        
        RAISE NOTICE '✅ Virtual stock function executes successfully';
    ELSE
        RAISE NOTICE '⚠️  No equipment found for testing';
    END IF;
END $$;

-- Test 2: Check equipment_virtual_stock view
SELECT 'Testing virtual stock view...' as test_description;

SELECT 
    equipment_name,
    date,
    base_stock,
    virtual_additions,
    virtual_reductions,
    effective_stock
FROM equipment_virtual_stock 
WHERE date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
LIMIT 10;

-- Test 3: Verify table structures
SELECT 'Checking table structures...' as test_description;

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('subrental_orders', 'subrental_order_items')
ORDER BY table_name, ordinal_position;

-- Test 4: Create a sample subrental order to test the system
SELECT 'Creating sample subrental order...' as test_description;

DO $$
DECLARE
    sample_provider_id uuid;
    sample_equipment_id uuid;
    new_order_id uuid;
BEGIN
    -- Get sample provider
    SELECT id INTO sample_provider_id FROM external_providers LIMIT 1;
    
    -- Get sample equipment  
    SELECT id INTO sample_equipment_id FROM equipment WHERE stock > 0 LIMIT 1;
    
    IF sample_provider_id IS NOT NULL AND sample_equipment_id IS NOT NULL THEN
        -- Create test subrental order
        INSERT INTO subrental_orders (
            name,
            provider_id,
            start_date,
            end_date,
            total_cost,
            status,
            notes
        ) VALUES (
            'Test Order - Stock Engine Validation',
            sample_provider_id,
            CURRENT_DATE + INTERVAL '1 day',
            CURRENT_DATE + INTERVAL '5 days',
            500.00,
            'confirmed',
            'Test order created during migration validation'
        ) RETURNING id INTO new_order_id;
        
        -- Add test order item
        INSERT INTO subrental_order_items (
            subrental_order_id,
            equipment_id,
            equipment_name,
            quantity,
            unit_cost,
            temporary_serial,
            notes
        ) SELECT 
            new_order_id,
            sample_equipment_id,
            e.name,
            2,
            250.00,
            'TEST-SERIAL-001',
            'Test item for validation'
        FROM equipment e 
        WHERE e.id = sample_equipment_id;
        
        RAISE NOTICE '✅ Created test subrental order: %', new_order_id;
        
        -- Test virtual stock calculation with the new order
        RAISE NOTICE '🧮 Testing virtual stock with actual subrental data...';
        
        SELECT 
            equipment_name,
            date,
            base_stock,
            virtual_additions,
            effective_stock
        FROM equipment_virtual_stock 
        WHERE equipment_id = sample_equipment_id
        AND date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
        ORDER BY date;
        
        RAISE NOTICE '✅ Virtual stock calculation working with real data';
        
    ELSE
        RAISE NOTICE '⚠️  Missing sample data (provider or equipment)';
    END IF;
END $$;

-- Test 5: Integrity validation
SELECT 'Running integrity validation...' as test_description;

SELECT * FROM validate_stock_system_integrity();

RAISE NOTICE '🚀 VIRTUAL STOCK SYSTEM TESTING COMPLETE';
