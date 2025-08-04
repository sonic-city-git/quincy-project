/**
 * Shared Booking State Management Hook
 * 
 * Eliminates duplicate booking state management logic between hubs
 */

import { useState, useCallback } from 'react';

interface BookingState {
  isLoading: boolean;
  data: any;
  error?: string;
  lastUpdated: number;
}

/**
 * Creates shared booking state management functions
 */
export function useBookingStateManager() {
  const [bookingStates, setBookingStates] = useState<Map<string, BookingState>>(new Map());

  const updateBookingState = useCallback((resourceId: string, dateStr: string, state: {
    isLoading?: boolean;
    data?: any;
    error?: string;
  }) => {
    const key = `${resourceId}-${dateStr}`;
    setBookingStates(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(key) || { isLoading: false, data: null, lastUpdated: 0 };
      newMap.set(key, {
        ...existing,
        ...state,
        lastUpdated: Date.now()
      });
      return newMap;
    });
  }, []);

  const getBookingState = useCallback((resourceId: string, dateStr: string) => {
    const key = `${resourceId}-${dateStr}`;
    return bookingStates.get(key);
  }, [bookingStates]);

  const batchUpdateBookings = useCallback((updates: Array<{
    resourceId: string;
    dateStr: string;
    state: Partial<BookingState>;
  }>) => {
    setBookingStates(prev => {
      const newMap = new Map(prev);
      updates.forEach(({ resourceId, dateStr, state }) => {
        const key = `${resourceId}-${dateStr}`;
        const existing = newMap.get(key) || { isLoading: false, data: null, lastUpdated: 0 };
        newMap.set(key, {
          ...existing,
          ...state,
          lastUpdated: Date.now()
        });
      });
      return newMap;
    });
  }, []);

  const clearStaleStates = useCallback(() => {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    setBookingStates(prev => {
      const newMap = new Map();
      prev.forEach((state, key) => {
        if (state.lastUpdated > oneHourAgo) {
          newMap.set(key, state);
        }
      });
      return newMap;
    });
  }, []);

  return {
    bookingStates,
    updateBookingState,
    getBookingState,
    batchUpdateBookings,
    clearStaleStates
  };
}