import { useState, useCallback } from 'react';

/**
 * Generic hook for managing filter state across different pages.
 * 
 * Eliminates duplicate filter state logic across Dashboard, Projects, Resources, and Planner pages.
 * Provides type-safe filter management with consistent patterns.
 * 
 * @param initialFilters - The initial filter state object
 * @returns [filters, setFilters, updateFilters, clearFilters] tuple
 * 
 * @example
 * ```tsx
 * // Dashboard filters
 * const [filters, setFilters, updateFilters, clearFilters] = useFilterState({
 *   search: '',
 *   owner: ''
 * });
 * 
 * // Resources filters  
 * const [filters, setFilters, updateFilters, clearFilters] = useFilterState({
 *   search: '',
 *   equipmentType: '',
 *   crewRole: ''
 * });
 * ```
 */
export function useFilterState<T extends Record<string, any>>(
  initialFilters: T
): [
  T,
  (filters: T) => void,
  (updates: Partial<T>) => void,
  () => void
] {
  const [filters, setFilters] = useState<T>(initialFilters);

  // Update specific filter fields while preserving others
  const updateFilters = useCallback((updates: Partial<T>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  // Clear all filters back to initial state
  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  return [filters, setFilters, updateFilters, clearFilters];
}