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
   * 🚀 FIXED: Invalidate all stock engine caches for a specific project
   * Uses CORRECT cache keys from the optimized system
   */
  const invalidateProjectStock = useCallback(async (projectId: string) => {
    console.log('🔄 [StockCache] Invalidating project stock caches for:', projectId);
    
    await Promise.all([
      // ✅ Project scope cache (new optimized system)
      queryClient.invalidateQueries({ 
        queryKey: ['project-scope', projectId] 
      }),
      
      // ✅ CORRECT: Equipment global cache
      queryClient.invalidateQueries({ 
        queryKey: ['equipment-global'] 
      }),
      
      // ✅ CORRECT: Virtual stock with dynamic params (invalidate all variations)
      queryClient.invalidateQueries({ 
        queryKey: ['virtual-stock'] 
      }),
      
      // ✅ CORRECT: Conflicts with dynamic params
      queryClient.invalidateQueries({ 
        queryKey: ['conflicts'] 
      }),
      
      // ✅ CORRECT: Suggestions cache
      queryClient.invalidateQueries({ 
        queryKey: ['suggestions'] 
      }),
      
      // ✅ CORRECT: Project bookings cache  
      queryClient.invalidateQueries({ 
        queryKey: ['project-bookings'] 
      }),
      
      // ✅ Event operational status
      queryClient.invalidateQueries({ 
        queryKey: ['event-equipment'] 
      }),
      queryClient.invalidateQueries({ 
        queryKey: ['event-roles'] 
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
      // ✅ CORRECT: Global equipment cache
      queryClient.invalidateQueries({ 
        queryKey: ['equipment-global'] 
      }),
      
      // ✅ CORRECT: All virtual stock variations
      queryClient.invalidateQueries({ 
        queryKey: ['virtual-stock'] 
      }),
      
      // ✅ CORRECT: All conflict variations
      queryClient.invalidateQueries({ 
        queryKey: ['conflicts'] 
      }),
      
      // ✅ CORRECT: All suggestions
      queryClient.invalidateQueries({ 
        queryKey: ['suggestions'] 
      }),
      
      // ✅ CORRECT: Project bookings
      queryClient.invalidateQueries({
        queryKey: ['project-bookings']
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
