/**
 * 🎯 UNIFIED STOCK CALCULATIONS SERVICE
 * 
 * Core service for all stock-related calculations.
 * Replaces fragmented logic across multiple hooks.
 */

import { supabase } from "@/integrations/supabase/client";
import { 
  EffectiveStock, 
  VirtualStockContribution, 
  StockBreakdown,
  BookingDetail 
} from "@/types/stock";
import { addDays, format, parseISO } from 'date-fns';

// =============================================================================
// CORE CALCULATION FUNCTIONS
// =============================================================================

/**
 * Calculate effective stock for specific equipment on specific date
 */
export async function calculateEffectiveStock(
  equipmentId: string, 
  date: string
): Promise<EffectiveStock> {
  const [baseStock, virtualAdditions, virtualReductions, totalUsed, equipmentName] = await Promise.all([
    getBaseStock(equipmentId),
    getVirtualAdditions(equipmentId, date),
    getVirtualReductions(equipmentId, date),
    getTotalUsed(equipmentId, date),
    getEquipmentName(equipmentId)
  ]);

  const effectiveStock = baseStock + virtualAdditions - virtualReductions;
  const available = effectiveStock - totalUsed;
  const isOverbooked = totalUsed > effectiveStock;
  const deficit = Math.max(0, totalUsed - effectiveStock);

  return {
    equipmentId,
    equipmentName,
    date,
    baseStock,
    virtualAdditions,
    virtualReductions,
    effectiveStock,
    totalUsed,
    available,
    isOverbooked,
    deficit
  };
}

/**
 * Batch calculate effective stock for multiple equipment over date range
 */
export async function calculateBatchEffectiveStock(
  equipmentIds: string[],
  startDate: string,
  endDate: string
): Promise<Map<string, Map<string, EffectiveStock>>> {
  if (equipmentIds.length === 0) {
    return new Map();
  }

  // Use the optimized database function for batch calculations
  const { data: stockData, error } = await supabase.rpc(
    'get_equipment_virtual_stock',
    {
      equipment_ids: equipmentIds,
      start_date: startDate,
      end_date: endDate
    }
  );

  if (error) {
    console.error('Error calculating batch effective stock:', error);
    console.error('Function parameters:', { equipmentIds, startDate, endDate });
    console.error('Error details:', { details: error.details, hint: error.hint, code: error.code });
    throw new Error(`Database function failed: ${error.message} - ${error.details || error.hint || ''}`);
  }

  // Get total usage for all equipment/dates
  const usageData = await getBatchTotalUsed(equipmentIds, startDate, endDate);

  // Organize results into nested Map: equipmentId -> date -> EffectiveStock
  const result = new Map<string, Map<string, EffectiveStock>>();

  stockData?.forEach(row => {
    const equipmentId = row.equipment_id;
    const date = row.date;
    const usage = usageData.get(`${equipmentId}-${date}`) || 0;

    if (!result.has(equipmentId)) {
      result.set(equipmentId, new Map());
    }

    const effectiveStock = row.effective_stock;
    const available = effectiveStock - usage;
    const isOverbooked = usage > effectiveStock;
    const deficit = Math.max(0, usage - effectiveStock);

    result.get(equipmentId)!.set(date, {
      equipmentId,
      equipmentName: row.equipment_name,
      date,
      baseStock: row.base_stock,
      virtualAdditions: row.virtual_additions,
      virtualReductions: row.virtual_reductions,
      effectiveStock,
      totalUsed: usage,
      available,
      isOverbooked,
      deficit
    });
  });

  return result;
}

/**
 * Get detailed stock breakdown including all contributions
 */
export async function getStockBreakdown(
  equipmentId: string,
  date: string
): Promise<StockBreakdown> {
  const [effectiveStock, contributions, bookingDetails] = await Promise.all([
    calculateEffectiveStock(equipmentId, date),
    getVirtualStockContributions(equipmentId, date),
    getBookingDetails(equipmentId, date)
  ]);

  return {
    equipmentId,
    date,
    effectiveStock,
    contributions,
    bookingDetails
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get base stock from equipment table
 */
async function getBaseStock(equipmentId: string): Promise<number> {
  const { data, error } = await supabase
    .from('equipment')
    .select('stock')
    .eq('id', equipmentId)
    .single();

  if (error) {
    console.error('Error fetching base stock:', error);
    return 0;
  }

  return data?.stock || 0;
}

/**
 * Get equipment name
 */
async function getEquipmentName(equipmentId: string): Promise<string> {
  const { data, error } = await supabase
    .from('equipment')
    .select('name')
    .eq('id', equipmentId)
    .single();

  if (error) {
    console.error('Error fetching equipment name:', error);
    return 'Unknown Equipment';
  }

  return data?.name || 'Unknown Equipment';
}

/**
 * Get virtual stock additions from subrental orders
 */
async function getVirtualAdditions(equipmentId: string, date: string): Promise<number> {
  const { data, error } = await supabase
    .from('subrental_order_items')
    .select(`
      quantity,
      subrental_orders!inner (
        start_date,
        end_date,
        status
      )
    `)
    .eq('equipment_id', equipmentId)
    .in('subrental_orders.status', ['confirmed', 'delivered'])
    .lte('subrental_orders.start_date', date)
    .gte('subrental_orders.end_date', date);

  if (error) {
    console.error('Error fetching virtual additions:', error);
    return 0;
  }

  return data?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
}

/**
 * Get virtual stock reductions from repair orders
 */
async function getVirtualReductions(equipmentId: string, date: string): Promise<number> {
  const { data, error } = await supabase
    .from('repair_order_items')
    .select(`
      quantity,
      repair_orders!inner (
        start_date,
        actual_end_date,
        estimated_end_date,
        status
      )
    `)
    .eq('equipment_id', equipmentId)
    .eq('repair_orders.status', 'in_repair')
    .lte('repair_orders.start_date', date);

  if (error) {
    // Repair orders might not exist yet, that's OK
    return 0;
  }

  // Only count items where repair is ongoing
  const reductions = data?.filter(item => {
    const repair = item.repair_orders;
    const endDate = repair.actual_end_date || repair.estimated_end_date;
    return !endDate || endDate >= date;
  }).reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

  return reductions;
}

/**
 * Get total usage from project bookings
 */
async function getTotalUsed(equipmentId: string, date: string): Promise<number> {
  const { data, error } = await supabase
    .from('project_event_equipment')
    .select(`
      quantity,
      project_events!inner (
        date
      )
    `)
    .eq('equipment_id', equipmentId)
    .eq('project_events.date', date);

  if (error) {
    console.error('Error fetching total used:', error);
    return 0;
  }

  return data?.reduce((sum, booking) => sum + (booking.quantity || 0), 0) || 0;
}

/**
 * Batch get total usage for multiple equipment/dates
 */
async function getBatchTotalUsed(
  equipmentIds: string[],
  startDate: string,
  endDate: string
): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from('project_event_equipment')
    .select(`
      equipment_id,
      quantity,
      project_events!inner (
        date
      )
    `)
    .in('equipment_id', equipmentIds)
    .gte('project_events.date', startDate)
    .lte('project_events.date', endDate);

  if (error) {
    console.error('Error fetching batch total used:', error);
    return new Map();
  }

  const usageMap = new Map<string, number>();

  data?.forEach(booking => {
    const key = `${booking.equipment_id}-${booking.project_events.date}`;
    const currentUsage = usageMap.get(key) || 0;
    usageMap.set(key, currentUsage + (booking.quantity || 0));
  });

  return usageMap;
}

/**
 * Get virtual stock contributions breakdown
 */
async function getVirtualStockContributions(
  equipmentId: string,
  date: string
): Promise<VirtualStockContribution[]> {
  const contributions: VirtualStockContribution[] = [];

  // Get subrental contributions
  const { data: subrentalData } = await supabase
    .from('subrental_order_items')
    .select(`
      quantity,
      subrental_orders!inner (
        id,
        name,
        start_date,
        end_date,
        status,
        external_providers!inner (
          company_name
        )
      )
    `)
    .eq('equipment_id', equipmentId)
    .in('subrental_orders.status', ['confirmed', 'delivered'])
    .lte('subrental_orders.start_date', date)
    .gte('subrental_orders.end_date', date);

  subrentalData?.forEach(item => {
    const order = item.subrental_orders;
    contributions.push({
      type: 'subrental',
      orderId: order.id,
      orderName: order.name,
      quantity: item.quantity,
      startDate: order.start_date,
      endDate: order.end_date,
      provider: order.external_providers.company_name
    });
  });

  // Get repair contributions (reductions)
  const { data: repairData } = await supabase
    .from('repair_order_items')
    .select(`
      quantity,
      repair_orders!inner (
        id,
        name,
        start_date,
        actual_end_date,
        estimated_end_date,
        status,
        facility_name
      )
    `)
    .eq('equipment_id', equipmentId)
    .eq('repair_orders.status', 'in_repair')
    .lte('repair_orders.start_date', date);

  repairData?.forEach(item => {
    const repair = item.repair_orders;
    const endDate = repair.actual_end_date || repair.estimated_end_date;
    
    if (!endDate || endDate >= date) {
      contributions.push({
        type: 'repair',
        orderId: repair.id,
        orderName: repair.name,
        quantity: -item.quantity, // Negative for reductions
        startDate: repair.start_date,
        endDate: endDate || '',
        facilityName: repair.facility_name
      });
    }
  });

  return contributions;
}

/**
 * Get booking details for specific equipment and date
 */
async function getBookingDetails(
  equipmentId: string,
  date: string
): Promise<BookingDetail[]> {
  const { data, error } = await supabase
    .from('project_event_equipment')
    .select(`
      quantity,
      project_events!inner (
        id,
        name,
        date,
        projects!inner (
          name
        )
      )
    `)
    .eq('equipment_id', equipmentId)
    .eq('project_events.date', date);

  if (error) {
    console.error('Error fetching booking details:', error);
    return [];
  }

  return data?.map(booking => ({
    eventId: booking.project_events.id,
    eventName: booking.project_events.name,
    projectName: booking.project_events.projects.name,
    quantity: booking.quantity || 0,
    date
  })) || [];
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if equipment is overbooked on specific date
 */
export async function isEquipmentOverbooked(
  equipmentId: string,
  date: string,
  additionalUsage = 0
): Promise<boolean> {
  const stock = await calculateEffectiveStock(equipmentId, date);
  return (stock.totalUsed + additionalUsage) > stock.effectiveStock;
}

/**
 * Get available quantity for equipment on specific date
 */
export async function getAvailableQuantity(
  equipmentId: string,
  date: string
): Promise<number> {
  const stock = await calculateEffectiveStock(equipmentId, date);
  return Math.max(0, stock.available);
}

/**
 * Generate date range array
 */
export function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  let currentDate = parseISO(startDate);
  const end = parseISO(endDate);

  while (currentDate <= end) {
    dates.push(format(currentDate, 'yyyy-MM-dd'));
    currentDate = addDays(currentDate, 1);
  }

  return dates;
}
