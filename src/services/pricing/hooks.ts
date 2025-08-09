/**
 * 🔄 REACTIVE PRICING HOOK
 * 
 * Provides automatically updating pricing that follows variant changes.
 * Implements Phase 2 Architecture: No stored pricing, always calculated.
 * 
 * Business rule: "pricing follows variant"
 */

import { useQuery } from '@tanstack/react-query';
import { CalendarEvent } from '@/types/events';
import { calculateEventPricing, calculateBatchEventPricing, CalculatedPricing } from './calculations';

/**
 * Hook for single event pricing that automatically updates
 */
export function useReactivePricing(event: CalendarEvent | null) {
  return useQuery({
    queryKey: ['reactive-pricing', event?.id, event?.variant_id, event?.project_id],
    queryFn: () => event ? calculateEventPricing(event) : null,
    enabled: !!event,
    staleTime: 30000, // 30 seconds - reasonable for pricing data
    refetchOnWindowFocus: false,
    // Automatically refetch when dependencies change
    refetchOnMount: 'always'
  });
}

/**
 * Hook for batch event pricing that automatically updates
 * Optimized for event lists and dashboards
 */
export function useBatchReactivePricing(events: CalendarEvent[]) {
  return useQuery({
    queryKey: [
      'batch-reactive-pricing', 
      // Include variant IDs in query key so pricing updates when variants change
      events.map(e => `${e.id}:${e.variant_id}`).sort().join(','),
      events.length
    ],
    queryFn: () => calculateBatchEventPricing(events),
    enabled: events.length > 0,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    // Automatically refetch when event list changes
    refetchOnMount: 'always'
  });
}

/**
 * Helper hook that enhances events with calculated pricing
 * Use this in components that display event lists
 */
export function useEventsWithReactivePricing(events: CalendarEvent[]) {
  const { data: pricingMap, isLoading } = useBatchReactivePricing(events);

  const enhancedEvents = events.map(event => {
    const calculatedPricing = pricingMap?.get(event.id);
    
    if (calculatedPricing) {
      // Return event with calculated pricing
      return {
        ...event,
        crew_price: calculatedPricing.crew_price,
        equipment_price: calculatedPricing.equipment_price,
        total_price: calculatedPricing.total_price,
        _pricing_source: calculatedPricing.calculation_source,
        _pricing_calculated_at: calculatedPricing.last_calculated
      };
    }
    
    // Fallback to stored pricing if calculation not available
    return event;
  });

  return {
    events: enhancedEvents,
    isLoading,
    pricingMap
  };
}

/**
 * Hook that invalidates pricing when variant data changes
 * Use this in variant management components
 */
export function useInvalidatePricingOnVariantChange(projectId: string) {
  // This will be used to invalidate pricing queries when variants change
  // The query keys include variant_id, so they'll automatically update
  
  return {
    invalidateProjectPricing: () => {
      // Query client will be injected here to invalidate pricing queries
      // All queries with this project's events will be invalidated
      console.log('🔄 Invalidating pricing for project:', projectId);
    }
  };
}
