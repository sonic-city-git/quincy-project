/**
 * 🎯 STOCK CACHE INVALIDATION UTILITY
 * 
 * Centralized cache invalidation for the unified stock engine.
 * Ensures all stock-related data updates when project data changes.
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export function useStockCacheInvalidation() {
  const queryClient = useQueryClient();

  /**
   * Invalidate all stock engine caches for a specific project
   * Call this when:
   * - Adding/removing equipment to variants
   * - Adding/removing/changing dates of events
   * - Changing event status (especially to/from cancelled)
   * - Adding/removing crew roles
   * - Any project resource changes
   */
  const invalidateProjectStock = useCallback(async (projectId: string) => {
    console.log('🔄 [StockCache] Invalidating project stock caches for:', projectId);
    
    await Promise.all([
      // ✅ Project date range cache (affects which dates to analyze)
      queryClient.invalidateQueries({ 
        queryKey: ['project-date-range', projectId] 
      }),
      
      // ✅ Equipment filter cache (affects which equipment to analyze)
      queryClient.invalidateQueries({ 
        queryKey: ['equipment-filtered'] 
      }),
      
      // ✅ Virtual stock calculations (core stock engine data)
      queryClient.invalidateQueries({ 
        queryKey: ['virtual-stock'] 
      }),
      
      // ✅ Conflict analysis (overbooking detection)
      queryClient.invalidateQueries({ 
        queryKey: ['conflicts'] 
      }),
      
      // ✅ Subrental suggestions (based on conflicts)
      queryClient.invalidateQueries({ 
        queryKey: ['suggestions'] 
      }),
      
      // ✅ Event operational status (per-event conflict data)
      queryClient.invalidateQueries({ 
        queryKey: ['event-equipment'] 
      }),
      queryClient.invalidateQueries({ 
        queryKey: ['event-roles'] 
      }),
      
      // ✅ PLANNER: Timeline cache invalidation 
      queryClient.invalidateQueries({
        queryKey: ['timeline-equipment']
      }),
      queryClient.invalidateQueries({
        queryKey: ['timeline-equipment-bookings']
      }),
    ]);
    
    console.log('✅ [StockCache] Project stock cache invalidation complete');
  }, [queryClient]);

  /**
   * Invalidate global stock caches (affects all projects)
   * Call this when:
   * - Equipment added/removed/modified globally
   * - Equipment stock levels changed
   * - Global equipment settings changed
   */
  const invalidateGlobalStock = useCallback(async () => {
    console.log('🔄 [StockCache] Invalidating global stock caches');
    
    await Promise.all([
      // ✅ All equipment data
      queryClient.invalidateQueries({ 
        queryKey: ['equipment-filtered'] 
      }),
      
      // ✅ All virtual stock calculations
      queryClient.invalidateQueries({ 
        queryKey: ['virtual-stock'] 
      }),
      
      // ✅ All conflict analysis
      queryClient.invalidateQueries({ 
        queryKey: ['conflicts'] 
      }),
      
      // ✅ All suggestions
      queryClient.invalidateQueries({ 
        queryKey: ['suggestions'] 
      }),
      
      // ✅ PLANNER: All timeline caches
      queryClient.invalidateQueries({
        queryKey: ['timeline-equipment']
      }),
      queryClient.invalidateQueries({
        queryKey: ['timeline-equipment-bookings']
      }),
    ]);
    
    console.log('✅ [StockCache] Global stock cache invalidation complete');
  }, [queryClient]);

  /**
   * Invalidate event-specific stock data
   * Call this when:
   * - Event equipment assignments change
   * - Event crew assignments change  
   * - Event status changes
   */
  const invalidateEventStock = useCallback(async (eventId: string, projectId?: string) => {
    console.log('🔄 [StockCache] Invalidating event stock caches for:', eventId);
    
    await Promise.all([
      // ✅ Event-specific caches
      queryClient.invalidateQueries({ 
        queryKey: ['event-equipment', eventId] 
      }),
      queryClient.invalidateQueries({ 
        queryKey: ['event-roles', eventId] 
      }),
      
      // ✅ Project-wide stock recalculation if project ID available
      ...(projectId ? [
        queryClient.invalidateQueries({ 
          queryKey: ['project-date-range', projectId] 
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['virtual-stock'] 
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['conflicts'] 
        }),
      ] : []),
    ]);
    
    console.log('✅ [StockCache] Event stock cache invalidation complete');
  }, [queryClient]);

  return {
    invalidateProjectStock,
    invalidateGlobalStock,
    invalidateEventStock
  };
}
