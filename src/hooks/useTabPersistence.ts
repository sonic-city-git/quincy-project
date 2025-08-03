import { useState, useEffect } from 'react';

/**
 * Hook for persisting tab state to localStorage with automatic validation.
 * 
 * Eliminates duplicate tab persistence logic across Dashboard, Projects, Planner, and Resources pages.
 * 
 * @param storageKey - The localStorage key to use (e.g., 'dashboard-active-tab')
 * @param defaultTab - The default tab value if none is stored or invalid
 * @param validTabs - Array of valid tab values for validation
 * @returns [activeTab, setActiveTab] tuple
 * 
 * @example
 * ```tsx
 * const [activeTab, setActiveTab] = useTabPersistence(
 *   'projects-active-tab',
 *   'active',
 *   ['active', 'archived'] as const
 * );
 * ```
 */
export function useTabPersistence<T extends string>(
  storageKey: string,
  defaultTab: T,
  validTabs: readonly T[]
): [T, (tab: T) => void] {
  // Initialize tab from localStorage with validation
  const [activeTab, setActiveTab] = useState<T>(() => {
    try {
      const savedTab = localStorage.getItem(storageKey);
      
      // Validate that the saved tab is in the list of valid tabs
      if (savedTab && validTabs.includes(savedTab as T)) {
        return savedTab as T;
      }
      
      return defaultTab;
    } catch (error) {
      // Handle localStorage errors (private mode, quota exceeded, etc.)
      console.warn(`Could not read from localStorage key "${storageKey}":`, error);
      return defaultTab;
    }
  });

  // Persist tab changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, activeTab);
    } catch (error) {
      // Silently handle localStorage errors (e.g., when in private mode)
      console.warn(`Could not save to localStorage key "${storageKey}":`, error);
    }
  }, [activeTab, storageKey]);

  return [activeTab, setActiveTab];
}