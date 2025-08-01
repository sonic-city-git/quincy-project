import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'equipmentPlannerExpandedGroups';

/**
 * Custom hook for managing persistent folder expansion state in equipment planner
 * Stores expansion state in localStorage and restores it on mount
 */
export function usePersistentExpandedGroups() {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    // Initialize from localStorage if available
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedGroups = JSON.parse(stored);
        return new Set(Array.isArray(parsedGroups) ? parsedGroups : []);
      }
    } catch (error) {
      console.warn('Failed to parse stored expanded groups:', error);
    }
    return new Set<string>();
  });

  // Save to localStorage whenever expandedGroups changes
  useEffect(() => {
    try {
      const groupsArray = Array.from(expandedGroups);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(groupsArray));
    } catch (error) {
      console.warn('Failed to save expanded groups to localStorage:', error);
    }
  }, [expandedGroups]);

  // Toggle group expansion with support for expand all subfolders
  const toggleGroup = useCallback((groupKey: string, expandAllSubfolders = false, availableSubfolders: string[] = []) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      
      if (expandAllSubfolders && !groupKey.includes('/')) {
        // Main folder with modifier key: toggle main folder and all subfolders
        const isMainExpanded = newSet.has(groupKey);
        
        if (isMainExpanded) {
          // Collapse main folder and all subfolders
          newSet.delete(groupKey);
          availableSubfolders.forEach(subFolderKey => {
            newSet.delete(subFolderKey);
          });
        } else {
          // Expand main folder and all subfolders
          newSet.add(groupKey);
          availableSubfolders.forEach(subFolderKey => {
            newSet.add(subFolderKey);
          });
        }
      } else {
        // Normal toggle
        if (newSet.has(groupKey)) {
          newSet.delete(groupKey);
        } else {
          newSet.add(groupKey);
        }
      }
      
      return newSet;
    });
  }, []);

  // Initialize default expanded state for new folders
  const initializeDefaultExpansion = useCallback((availableMainFolders: string[]) => {
    setExpandedGroups(prev => {
      // Only initialize if no groups are currently expanded
      if (prev.size === 0 && availableMainFolders.length > 0) {
        return new Set(availableMainFolders);
      }
      return prev;
    });
  }, []);

  // Clear all expanded groups (useful for reset functionality)
  const clearExpandedGroups = useCallback(() => {
    setExpandedGroups(new Set());
  }, []);

  // Expand all groups (useful for expand all functionality)
  const expandAllGroups = useCallback((allGroupKeys: string[]) => {
    setExpandedGroups(new Set(allGroupKeys));
  }, []);

  return {
    expandedGroups,
    toggleGroup,
    initializeDefaultExpansion,
    clearExpandedGroups,
    expandAllGroups,
    setExpandedGroups
  };
}