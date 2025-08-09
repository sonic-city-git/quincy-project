#!/usr/bin/env node

/**
 * Simple test script to validate the new stock system
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testStockSystem() {
  console.log('🔍 Testing Unified Stock System...');
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
    } else {
      console.log('✅ subrental_orders table accessible');
    }

    const { data: items, error: itemsError } = await supabase
      .from('subrental_order_items')
      .select('count(*)')
      .limit(1);
    
    if (itemsError) {
      console.error('❌ subrental_order_items table error:', itemsError.message);
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
      return;
    }

    console.log(`📦 Testing with equipment: ${equipment.name} (Stock: ${equipment.stock})`);

    // Test virtual stock calculation
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: virtualStock, error: virtualError } = await supabase
      .rpc('get_equipment_virtual_stock', {
        equipment_ids: [equipment.id],
        start_date: today,
        end_date: nextWeek
      });

    if (virtualError) {
      console.error('❌ Virtual stock function error:', virtualError.message);
    } else {
      console.log('✅ Virtual stock function working');
      console.log(`📊 Got ${virtualStock?.length || 0} stock calculations`);
      
      if (virtualStock && virtualStock.length > 0) {
        const sample = virtualStock[0];
        console.log(`   Sample: ${sample.equipment_name} on ${sample.date}`);
        console.log(`   Base: ${sample.base_stock}, Virtual: +${sample.virtual_additions} -${sample.virtual_reductions}, Effective: ${sample.effective_stock}`);
      }
    }

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
      return;
    }

    // Create test order
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
      } else {
        console.log('✅ Created test order item:', newItem.id);
        
        // Test virtual stock again with the new data
        console.log('\n🔄 Test 4: Re-testing virtual stock with actual data...');
        
        const { data: updatedStock, error: updatedError } = await supabase
          .rpc('get_equipment_virtual_stock', {
            equipment_ids: [equipment.id],
            start_date: today,
            end_date: nextWeek
          });

        if (updatedError) {
          console.error('❌ Updated virtual stock error:', updatedError.message);
        } else {
          console.log('✅ Virtual stock calculation updated');
          
          const todayStock = updatedStock?.find(s => s.date === today);
          if (todayStock) {
            console.log(`📊 Today's effective stock: ${todayStock.effective_stock} (base: ${todayStock.base_stock} + virtual: ${todayStock.virtual_additions})`);
            
            if (todayStock.virtual_additions > 0) {
              console.log('🎉 SUCCESS: Virtual stock additions working correctly!');
            }
          }
        }
      }
    }

    console.log('\n=====================================');
    console.log('🚀 STOCK SYSTEM TESTING COMPLETE');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

testStockSystem();
