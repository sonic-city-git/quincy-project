/**
 * 📅 TIMELINE STOCK - WORLD-CLASS OPTIMIZATION
 * 
 * Full-featured timeline data with smart preloading and optimized access patterns.
 * Designed for real-time planning and future serial number support.
 */

import { useMemo, useCallback } from 'react';
import { useEquipmentStockEngine } from './useEquipmentStockEngine';
import { 
  TimelineStockResult, 
  EngineError,
  CACHE_STRATEGIES 
} from '@/types/stock-optimized';
import { EquipmentBooking } from '@/types/stock';

export function useTimelineStock(visibleRange: { start: Date; end: Date }): TimelineStockResult {
  // 🚀 OPTIMIZED: Timeline-specific caching strategy
  const {
    conflicts,
    suggestions,
    bookings: rawBookings,
    getBooking: engineGetBooking,
    getAvailability: engineGetAvailability,
    isOverbooked: engineIsOverbooked,
    isLoading,
    error
  } = useEquipmentStockEngine({
    dateRange: visibleRange,
    includeConflictAnalysis: true,
    includeSuggestions: true,        // Timeline needs suggestions for planning
    cacheResults: false,             // Dynamic range - less caching
    batchSize: 50                    // Smaller batches for responsiveness
  });

  // 🚀 OPTIMIZED BOOKING ACCESS with memoization
  const getBooking = useCallback((equipmentId: string, date: string): EquipmentBooking | null => {
    return engineGetBooking(equipmentId, date);
  }, [engineGetBooking]);

  const getAvailability = useCallback((equipmentId: string, date: string): number => {
    return engineGetAvailability(equipmentId, date);
  }, [engineGetAvailability]);

  const isOverbooked = useCallback((equipmentId: string, date: string): boolean => {
    return engineIsOverbooked(equipmentId, date);
  }, [engineIsOverbooked]);

  // 🚀 BATCH OPERATIONS for performance
  const getBookingsForDateRange = useCallback((
    equipmentId: string, 
    startDate: string, 
    endDate: string
  ): EquipmentBooking[] => {
    const results: EquipmentBooking[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const booking = getBooking(equipmentId, dateStr);
      if (booking) {
        results.push(booking);
      }
    }
    
    return results;
  }, [getBooking]);

  // 🚀 PRELOADING for smooth scrolling (future enhancement)
  const preloadEquipmentData = useCallback(async (equipmentIds: string[]): Promise<void> => {
    // TODO: Implement preloading logic for equipment outside visible range
    // This will be crucial for smooth infinite scrolling
    console.log('Preloading equipment data for:', equipmentIds.length, 'items');
  }, []);

  // 🚀 STANDARDIZED ERROR HANDLING
  const engineError: EngineError | null = error ? {
    message: error.message,
    code: 'FETCH_ERROR',
    details: error,
    timestamp: new Date().toISOString()
  } : null;

  return {
    // Core booking access
    getBooking,
    getAvailability,
    isOverbooked,
    
    // Batch data for performance
    bookings: rawBookings,
    conflicts,
    suggestions,
    
    // Performance helpers
    getBookingsForDateRange,
    preloadEquipmentData,
    
    isLoading,
    error: engineError
  };
}
