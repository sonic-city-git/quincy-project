/**
 * Test the database function directly
 */

import { supabase } from '@/integrations/supabase/client';

export async function testDatabaseFunction() {
  console.log('🔍 Testing get_equipment_virtual_stock function...');

  try {
    // Test 1: Check if function exists by calling it with empty array
    console.log('Test 1: Testing with empty equipment array...');
    const { data: emptyTest, error: emptyError } = await supabase.rpc(
      'get_equipment_virtual_stock',
      {
        equipment_ids: [],
        start_date: '2025-01-17',
        end_date: '2025-01-18'
      }
    );

    if (emptyError) {
      console.error('❌ Function call failed:', emptyError);
      console.error('Error details:', {
        message: emptyError.message,
        details: emptyError.details,
        hint: emptyError.hint,
        code: emptyError.code
      });
      return;
    }

    console.log('✅ Function exists and accepts parameters');
    console.log('Empty test result:', emptyTest);

    // Test 2: Get a real equipment ID and test
    console.log('\nTest 2: Getting real equipment for testing...');
    const { data: equipment, error: equipError } = await supabase
      .from('equipment')
      .select('id, name, stock')
      .limit(1)
      .single();

    if (equipError) {
      console.error('❌ Could not get equipment:', equipError);
      return;
    }

    console.log('📦 Testing with equipment:', equipment);

    // Test 3: Call function with real equipment ID
    console.log('\nTest 3: Testing with real equipment ID...');
    const { data: realTest, error: realError } = await supabase.rpc(
      'get_equipment_virtual_stock',
      {
        equipment_ids: [equipment.id],
        start_date: '2025-01-17',
        end_date: '2025-01-18'
      }
    );

    if (realError) {
      console.error('❌ Function call with real data failed:', realError);
      console.error('Error details:', {
        message: realError.message,
        details: realError.details,
        hint: realError.hint,
        code: realError.code
      });
      return;
    }

    console.log('✅ Function works with real equipment data');
    console.log('Real test result:', realTest);

    // Test 4: Check table existence
    console.log('\nTest 4: Checking required tables...');
    
    const { data: subrentalOrders, error: soError } = await supabase
      .from('subrental_orders')
      .select('count(*)')
      .limit(1);

    if (soError) {
      console.error('❌ subrental_orders table issue:', soError);
    } else {
      console.log('✅ subrental_orders table exists');
    }

    const { data: subrentalItems, error: siError } = await supabase
      .from('subrental_order_items')
      .select('count(*)')
      .limit(1);

    if (siError) {
      console.error('❌ subrental_order_items table issue:', siError);
    } else {
      console.log('✅ subrental_order_items table exists');
    }

    console.log('\n🎉 Database function test completed successfully!');

  } catch (error) {
    console.error('💥 Unexpected error during database function test:', error);
  }
}

// Auto-run if in development
if (process.env.NODE_ENV === 'development') {
  // Will be called from components for testing
}
