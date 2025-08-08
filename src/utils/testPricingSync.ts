/**
 * 🧪 PRICING SYNC TEST UTILITY
 * 
 * This utility helps debug the pricing synchronization flow
 * to identify where the chain is breaking.
 */

import { supabase } from '@/integrations/supabase/client';
import { syncEventsForCrewRateChange } from './variantEventSync';

export interface PricingSyncTest {
  projectId: string;
  variantId: string;
}

/**
 * Test the complete pricing sync flow
 */
export async function testPricingSyncFlow({ projectId, variantId }: PricingSyncTest) {
  console.log('🧪 STARTING PRICING SYNC TEST');
  console.log('Project ID:', projectId);
  console.log('Variant ID:', variantId);

  try {
    // 1. Check current event pricing in database
    console.log('\n📊 STEP 1: Current event pricing in database');
    const { data: eventsBefore, error: beforeError } = await supabase
      .from('project_events')
      .select('id, name, variant_id, crew_price, equipment_price, total_price, updated_at')
      .eq('project_id', projectId)
      .eq('variant_id', variantId);

    if (beforeError) {
      console.error('❌ Error fetching events:', beforeError);
      return;
    }

    console.log(`Found ${eventsBefore?.length || 0} events using this variant:`);
    eventsBefore?.forEach(event => {
      console.log(`  - ${event.name}: crew_price=${event.crew_price}, total_price=${event.total_price}`);
    });

    // 2. Check variant crew roles
    console.log('\n👥 STEP 2: Current variant crew roles');
    const { data: crewRoles, error: crewError } = await supabase
      .from('project_roles')
      .select(`
        id,
        daily_rate,
        role:crew_roles(name)
      `)
      .eq('project_id', projectId)
      .eq('variant_id', variantId);

    if (crewError) {
      console.error('❌ Error fetching crew roles:', crewError);
      return;
    }

    console.log(`Found ${crewRoles?.length || 0} crew roles in variant:`);
    crewRoles?.forEach(role => {
      console.log(`  - ${role.role.name}: daily_rate=${role.daily_rate}`);
    });

    // 3. Trigger sync
    console.log('\n🔄 STEP 3: Triggering sync...');
    await syncEventsForCrewRateChange(projectId, variantId);

    // 4. Check pricing after sync
    console.log('\n📊 STEP 4: Event pricing after sync');
    const { data: eventsAfter, error: afterError } = await supabase
      .from('project_events')
      .select('id, name, variant_id, crew_price, equipment_price, total_price, updated_at')
      .eq('project_id', projectId)
      .eq('variant_id', variantId);

    if (afterError) {
      console.error('❌ Error fetching events after sync:', afterError);
      return;
    }

    console.log('Events after sync:');
    eventsAfter?.forEach(event => {
      const before = eventsBefore?.find(e => e.id === event.id);
      const priceChanged = before?.crew_price !== event.crew_price;
      console.log(`  - ${event.name}: crew_price=${event.crew_price}, total_price=${event.total_price} ${priceChanged ? '🔄 CHANGED' : '⚪ unchanged'}`);
    });

    // 5. Summary
    const changedEvents = eventsAfter?.filter(after => {
      const before = eventsBefore?.find(e => e.id === after.id);
      return before?.crew_price !== after.crew_price;
    });

    console.log(`\n✅ TEST COMPLETE: ${changedEvents?.length || 0} events had pricing changes`);

    if (changedEvents?.length === 0 && eventsAfter?.length > 0) {
      console.log('⚠️  WARNING: No pricing changes detected - sync may have failed silently');
    }

    return {
      eventsBefore,
      eventsAfter,
      crewRoles,
      changedEvents
    };

  } catch (error) {
    console.error('❌ TEST FAILED:', error);
    throw error;
  }
}

/**
 * Quick test function to call from browser console
 */
export function testPricing() {
  return testPricingSyncFlow({
    projectId: 'e8d99281-6165-4392-864f-48b6155e7eb4',
    variantId: 'YOUR_VARIANT_ID_HERE' // Replace with actual variant ID
  });
}
