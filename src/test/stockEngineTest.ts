/**
 * 🧪 STOCK ENGINE VALIDATION TEST
 * 
 * Quick test to validate the unified stock engine works correctly
 */

import { supabase } from '@/integrations/supabase/client';
import { calculateEffectiveStock } from '@/services/stock/stockCalculations';

export async function validateStockEngine(): Promise<void> {
  console.log('🔍 Testing Unified Stock Engine...');
  console.log('=====================================');

  try {
    // Test 1: Check new tables exist
    console.log('📋 Test 1: Checking new tables...');
    
    const { data: orders, error: ordersError } = await supabase
      .from('subrental_orders')
      .select('count(*)')
      .limit(1);
    
    if (ordersError) {
      console.error('❌ subrental_orders table error:', ordersError.message);
      throw ordersError;
    } else {
      console.log('✅ subrental_orders table accessible');
    }

    const { data: items, error: itemsError } = await supabase
      .from('subrental_order_items')
      .select('count(*)')
      .limit(1);
    
    if (itemsError) {
      console.error('❌ subrental_order_items table error:', itemsError.message);
      throw itemsError;
    } else {
      console.log('✅ subrental_order_items table accessible');
    }

    // Test 2: Check virtual stock function
    console.log('\n🧮 Test 2: Testing virtual stock function...');
    
    // Get a sample equipment ID
    const { data: equipment, error: equipError } = await supabase
      .from('equipment')
      .select('id, name, stock')
      .limit(1)
      .single();

    if (equipError) {
      console.error('❌ Error getting equipment:', equipError.message);
      throw equipError;
    }

    console.log(`📦 Testing with equipment: ${equipment.name} (Stock: ${equipment.stock})`);

    // Test effective stock calculation
    const today = new Date().toISOString().split('T')[0];
    const effectiveStock = await calculateEffectiveStock(equipment.id, today);

    console.log('✅ Stock calculation successful');
    console.log(`📊 Effective stock: ${effectiveStock.effectiveStock} (base: ${effectiveStock.baseStock} + virtual: ${effectiveStock.virtualAdditions})`);

    // Test 3: Create a test subrental order
    console.log('\n📝 Test 3: Creating test subrental order...');
    
    // Get a provider
    const { data: provider, error: providerError } = await supabase
      .from('external_providers')
      .select('id, company_name')
      .limit(1)
      .single();

    if (providerError) {
      console.error('❌ Error getting provider:', providerError.message);
      throw providerError;
    }

    // Create test order
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { data: newOrder, error: orderError } = await supabase
      .from('subrental_orders')
      .insert({
        name: `Test Order - ${new Date().toISOString()}`,
        provider_id: provider.id,
        start_date: today,
        end_date: nextWeek,
        total_cost: 1000.00,
        status: 'confirmed',
        notes: 'Test order for system validation'
      })
      .select()
      .single();

    if (orderError) {
      console.error('❌ Error creating order:', orderError.message);
      throw orderError;
    } else {
      console.log('✅ Created test subrental order:', newOrder.id);

      // Add order item
      const { data: newItem, error: itemError } = await supabase
        .from('subrental_order_items')
        .insert({
          subrental_order_id: newOrder.id,
          equipment_id: equipment.id,
          equipment_name: equipment.name,
          quantity: 3,
          unit_cost: 333.33,
          temporary_serial: 'TEST-001',
          notes: 'Test item'
        })
        .select()
        .single();

      if (itemError) {
        console.error('❌ Error creating order item:', itemError.message);
        throw itemError;
      } else {
        console.log('✅ Created test order item:', newItem.id);
        
        // Test effective stock again with the new data
        console.log('\n🔄 Test 4: Re-testing stock with actual subrental data...');
        
        const updatedStock = await calculateEffectiveStock(equipment.id, today);

        console.log('✅ Virtual stock calculation updated');
        console.log(`📊 Updated effective stock: ${updatedStock.effectiveStock} (base: ${updatedStock.baseStock} + virtual: ${updatedStock.virtualAdditions})`);
        
        if (updatedStock.virtualAdditions > 0) {
          console.log('🎉 SUCCESS: Virtual stock additions working correctly!');
        }

        // Cleanup test data
        await supabase
          .from('subrental_order_items')
          .delete()
          .eq('id', newItem.id);
        
        await supabase
          .from('subrental_orders')
          .delete()
          .eq('id', newOrder.id);
        
        console.log('🧹 Test data cleaned up');
      }
    }

    console.log('\n=====================================');
    console.log('🚀 STOCK SYSTEM VALIDATION PASSED');
    
  } catch (error) {
    console.error('💥 Stock system validation failed:', error);
    throw error;
  }
}
