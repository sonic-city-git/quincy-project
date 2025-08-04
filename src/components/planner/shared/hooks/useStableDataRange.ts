/**
 * Shared Stable Data Range Hook
 * 
 * Eliminates duplicate stable data range logic between useEquipmentHub and useCrewHub
 */

import { useMemo } from 'react';

interface UseStableDataRangeProps {
  periodStart: Date;
  periodEnd: Date;
  bufferDays?: number;
}

interface StableDataRange {
  start: Date;
  end: Date;
  dayCount?: number;
}

/**
 * Creates a stable date range that doesn't change on every timeline expansion
 * This prevents cascade refetches while still fetching needed data
 */
export function useStableDataRange({
  periodStart,
  periodEnd,
  bufferDays = 70
}: UseStableDataRangeProps): StableDataRange {
  
  const stableDataRange = useMemo(() => {
    // Use a wider, more stable range that doesn't change on every expansion
    const centerDate = new Date();
    const stableStart = new Date(centerDate);
    stableStart.setDate(centerDate.getDate() - bufferDays);
    const stableEnd = new Date(centerDate);
    stableEnd.setDate(centerDate.getDate() + bufferDays);
    
    // Only update stable range if current range extends far beyond our buffer
    const currentStart = periodStart;
    const currentEnd = periodEnd;
    
    // If the requested range is within our stable buffer, use stable range
    if (currentStart >= stableStart && currentEnd <= stableEnd) {
      return { 
        start: stableStart, 
        end: stableEnd, 
        dayCount: bufferDays * 2 
      };
    }
    
    // If requested range exceeds buffer, expand the stable range incrementally
    const expandedStart = currentStart < stableStart ? currentStart : stableStart;
    const expandedEnd = currentEnd > stableEnd ? currentEnd : stableEnd;
    const dayCount = Math.ceil((expandedEnd.getTime() - expandedStart.getTime()) / (1000 * 60 * 60 * 24));
    
    return { start: expandedStart, end: expandedEnd, dayCount };
  }, [
    // Use weekly precision instead of daily to reduce sensitivity
    Math.floor(periodStart.getTime() / (7 * 24 * 60 * 60 * 1000)), 
    Math.floor(periodEnd.getTime() / (7 * 24 * 60 * 60 * 1000)),
    bufferDays
  ]);

  return stableDataRange;
}