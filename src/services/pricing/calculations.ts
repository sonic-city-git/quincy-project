/**
 * 💰 REACTIVE PRICING CALCULATION SYSTEM
 * 
 * Implements Phase 2 Architecture Consolidation:
 * - Pricing calculated dynamically from variant data
 * - No stored pricing values that can become stale
 * - Automatic updates when variant changes
 * - Follows business rule: "pricing follows variant"
 */

import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent } from '@/types/events';
import { DEFAULT_PRICING_CONFIG, CrewPricingSource } from '@/constants/businessRules';

export interface CalculatedPricing {
  crew_price: number;
  equipment_price: number;
  total_price: number;
  calculation_source: 'variant' | 'stored' | 'error';
  last_calculated: Date;
}

/**
 * Calculate event pricing dynamically from variant data
 * This replaces stored pricing with live calculation
 */
export async function calculateEventPricing(event: CalendarEvent): Promise<CalculatedPricing> {
  try {
    // If no variant, return zero pricing
    if (!event.variant_id) {
      return {
        crew_price: 0,
        equipment_price: 0,
        total_price: 0,
        calculation_source: 'variant',
        last_calculated: new Date()
      };
    }

    // Get pricing configuration (eventually from admin settings)
    const pricingConfig = DEFAULT_PRICING_CONFIG;
    
    // Calculate based on configured source
    if (pricingConfig.crew_pricing_source === CrewPricingSource.VARIANT_RATES) {
      return await calculateFromVariantRates(event);
    } else {
      return await calculateFromEventAssignments(event);
    }

  } catch (error) {
    console.error('❌ Error calculating event pricing:', error);
    
    // Fallback to stored values if calculation fails
    return {
      crew_price: event.crew_price || 0,
      equipment_price: event.equipment_price || 0,
      total_price: event.total_price || 0,
      calculation_source: 'error',
      last_calculated: new Date()
    };
  }
}

/**
 * Calculate pricing from variant template rates
 * Business rule: "pricing follows variant"
 */
async function calculateFromVariantRates(event: CalendarEvent): Promise<CalculatedPricing> {
  // Get event type multipliers
  const eventTypeMultiplier = event.type?.crew_rate_multiplier || 1.0;
  
  // Get variant crew roles and their rates
  const { data: crewRoles, error: crewError } = await supabase
    .from('project_roles')
    .select('daily_rate, hourly_rate')
    .eq('project_id', event.project_id)
    .eq('variant_id', event.variant_id);

  if (crewError) {
    throw new Error(`Failed to fetch crew roles: ${crewError.message}`);
  }

  // Calculate crew pricing from variant rates
  const crew_price = (crewRoles || []).reduce((total, role) => {
    return total + ((role.daily_rate || 0) * eventTypeMultiplier);
  }, 0);

  // Get variant equipment and their prices
  const { data: equipment, error: equipmentError } = await supabase
    .from('project_equipment')
    .select(`
      quantity,
      equipment:equipment (
        rental_price
      )
    `)
    .eq('project_id', event.project_id)
    .eq('variant_id', event.variant_id);

  if (equipmentError) {
    throw new Error(`Failed to fetch equipment: ${equipmentError.message}`);
  }

  // Calculate equipment pricing from variant equipment
  const equipmentTypeMultiplier = event.type?.equipment_rate_multiplier || 1.0;
  const equipment_price = (equipment || []).reduce((total, item) => {
    const price = item.equipment?.rental_price || 0;
    return total + (price * item.quantity * equipmentTypeMultiplier);
  }, 0);

  const total_price = crew_price + equipment_price;

  return {
    crew_price,
    equipment_price,
    total_price,
    calculation_source: 'variant',
    last_calculated: new Date()
  };
}

/**
 * Calculate pricing from actual event assignments
 * Used when pricingConfig.crew_pricing_source === EVENT_ASSIGNMENTS
 */
async function calculateFromEventAssignments(event: CalendarEvent): Promise<CalculatedPricing> {
  // Get actual event crew assignments
  const { data: eventRoles, error: crewError } = await supabase
    .from('project_event_roles')
    .select('daily_rate, hourly_rate')
    .eq('event_id', event.id);

  if (crewError) {
    throw new Error(`Failed to fetch event roles: ${crewError.message}`);
  }

  // Calculate crew pricing from actual assignments
  const eventTypeMultiplier = event.type?.crew_rate_multiplier || 1.0;
  const crew_price = (eventRoles || []).reduce((total, role) => {
    return total + ((role.daily_rate || 0) * eventTypeMultiplier);
  }, 0);

  // Get actual event equipment
  const { data: eventEquipment, error: equipmentError } = await supabase
    .from('project_event_equipment')
    .select(`
      quantity,
      equipment:equipment (
        rental_price
      )
    `)
    .eq('event_id', event.id);

  if (equipmentError) {
    throw new Error(`Failed to fetch event equipment: ${equipmentError.message}`);
  }

  // Calculate equipment pricing from actual assignments
  const equipmentTypeMultiplier = event.type?.equipment_rate_multiplier || 1.0;
  const equipment_price = (eventEquipment || []).reduce((total, item) => {
    const price = item.equipment?.rental_price || 0;
    return total + (price * item.quantity * equipmentTypeMultiplier);
  }, 0);

  const total_price = crew_price + equipment_price;

  return {
    crew_price,
    equipment_price,
    total_price,
    calculation_source: 'variant',
    last_calculated: new Date()
  };
}

/**
 * Calculate pricing for multiple events in batch
 * Optimized for performance when displaying event lists
 */
export async function calculateBatchEventPricing(events: CalendarEvent[]): Promise<Map<string, CalculatedPricing>> {
  const results = new Map<string, CalculatedPricing>();
  
  // Process events in parallel for performance
  const calculations = events.map(async (event) => {
    try {
      const pricing = await calculateEventPricing(event);
      results.set(event.id, pricing);
    } catch (error) {
      console.error(`❌ Failed to calculate pricing for event ${event.id}:`, error);
      // Store fallback pricing
      results.set(event.id, {
        crew_price: event.crew_price || 0,
        equipment_price: event.equipment_price || 0,
        total_price: event.total_price || 0,
        calculation_source: 'error',
        last_calculated: new Date()
      });
    }
  });

  await Promise.all(calculations);
  return results;
}
