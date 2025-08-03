/**
 * PLANNER BUG FIXES: Expansion State Synchronization
 * 
 * Fixes expansion state conflicts between:
 * 1. Persistent expansion state (localStorage)
 * 2. Filter-based forced expansion
 * 3. Equipment-level expansion
 * 4. Subfolder expansion
 */

import { useMemo, useCallback } from 'react';

export interface ExpansionState {
  // Group-level expansion (main folders)
  expandedGroups: Set<string>;
  
  // Equipment-level expansion (individual items)
  expandedEquipment: Set<string>;
  
  // Filter-based forced expansion
  filterBasedExpansion?: Map<string, boolean>;
}

export interface ExpansionActions {
  toggleGroup: (groupKey: string, expandAllSubfolders?: boolean) => void;
  toggleEquipment: (equipmentId: string) => void;
}

/**
 * Unified expansion state resolver
 * Prevents conflicts between different expansion sources
 */
export function useUnifiedExpansionState(
  persistentExpandedGroups: Set<string>,
  filterBasedExpansion: Map<string, boolean> = new Map(),
  hasActiveFilters: boolean = false
) {
  
  const resolvedExpansionState = useMemo(() => {
    const resolved = new Map<string, boolean>();
    
    // Start with persistent state
    persistentExpandedGroups.forEach(groupKey => {
      resolved.set(groupKey, true);
    });
    
    // Override with filter-based expansion when filters are active
    if (hasActiveFilters) {
      filterBasedExpansion.forEach((isExpanded, groupKey) => {
        resolved.set(groupKey, isExpanded);
      });
    }
    
    return resolved;
  }, [persistentExpandedGroups, filterBasedExpansion, hasActiveFilters]);
  
  return {
    isGroupExpanded: (groupKey: string) => resolvedExpansionState.get(groupKey) ?? false,
    resolvedExpansionState
  };
}

/**
 * Enhanced expansion toggle that handles conflicts
 */
export function createUnifiedExpansionToggle(
  persistentToggle: (groupKey: string, expandAllSubfolders?: boolean, subFolderKeys?: string[]) => void,
  equipmentGroups: any[],
  hasActiveFilters: boolean = false
) {
  
  return useCallback((groupKey: string, expandAllSubfolders?: boolean) => {
    // When filters are active, don't persist expansion changes
    // This prevents conflicts with filter-based expansion
    if (hasActiveFilters) {
      // Just trigger visual expansion without persisting
      return;
    }
    
    // Normal persistent expansion when no filters
    if (expandAllSubfolders) {
      const group = equipmentGroups.find(g => g.mainFolder === groupKey);
      const subFolderKeys = group?.subFolders?.map(
        (subFolder: any) => `${groupKey}/${subFolder.name}`
      ) || [];
      
      persistentToggle(groupKey, expandAllSubfolders, subFolderKeys);
    } else {
      persistentToggle(groupKey, false);
    }
  }, [persistentToggle, equipmentGroups, hasActiveFilters]);
}

/**
 * Equipment expansion state manager
 * Keeps track of individual item expansions
 */
export function useEquipmentExpansionState(initialExpanded: Set<string> = new Set()) {
  const [expandedEquipment, setExpandedEquipment] = useState(initialExpanded);
  
  const toggleEquipmentExpansion = useCallback((equipmentId: string) => {
    setExpandedEquipment(prev => {
      const newSet = new Set(prev);
      if (newSet.has(equipmentId)) {
        newSet.delete(equipmentId);
      } else {
        newSet.add(equipmentId);
      }
      return newSet;
    });
  }, []);
  
  const isEquipmentExpanded = useCallback((equipmentId: string) => {
    return expandedEquipment.has(equipmentId);
  }, [expandedEquipment]);
  
  return {
    expandedEquipment,
    toggleEquipmentExpansion,
    isEquipmentExpanded,
    setExpandedEquipment
  };
}

/**
 * Auto-expansion for filtered results
 * Manages filter-based expansion without conflicts
 */
export function useAutoExpansionForFilters(
  equipmentGroups: any[],
  filters: any,
  showProblemsOnly: boolean,
  shouldExpand: Set<string>,
  toggleGroup: (groupKey: string) => void
) {
  
  const hasActiveFilters = useMemo(() => {
    const hasTextFilters = filters && (filters.search || filters.equipmentType || filters.crewRole);
    return hasTextFilters || showProblemsOnly;
  }, [filters, showProblemsOnly]);
  
  // Auto-expand folders that contain filtered results
  useEffect(() => {
    if (hasActiveFilters && shouldExpand.size > 0) {
      // Use a timeout to avoid expansion conflicts during render
      const timer = setTimeout(() => {
        shouldExpand.forEach(groupKey => {
          toggleGroup(groupKey);
        });
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [hasActiveFilters, shouldExpand.size, toggleGroup]);
  
  return hasActiveFilters;
}

/**
 * Complete expansion state management solution
 */
export function useCompleteExpansionState(
  persistentExpandedGroups: Set<string>,
  persistentToggleGroup: (groupKey: string, expandAllSubfolders?: boolean, subFolderKeys?: string[]) => void,
  equipmentGroups: any[],
  filters: any,
  showProblemsOnly: boolean,
  shouldExpand: Set<string>
) {
  
  // Equipment-level expansion
  const equipmentExpansion = useEquipmentExpansionState();
  
  // Determine if filters are active
  const hasActiveFilters = useMemo(() => {
    const hasTextFilters = filters && (filters.search || filters.equipmentType || filters.crewRole);
    return hasTextFilters || showProblemsOnly;
  }, [filters, showProblemsOnly]);
  
  // Unified group expansion toggle
  const toggleGroup = createUnifiedExpansionToggle(
    persistentToggleGroup,
    equipmentGroups,
    hasActiveFilters
  );
  
  // Auto-expansion for filters
  useAutoExpansionForFilters(
    equipmentGroups,
    filters,
    showProblemsOnly,
    shouldExpand,
    toggleGroup
  );
  
  // Unified expansion state resolver
  const filterBasedExpansion = useMemo(() => {
    const map = new Map<string, boolean>();
    if (hasActiveFilters) {
      shouldExpand.forEach(groupKey => {
        map.set(groupKey, true);
      });
    }
    return map;
  }, [hasActiveFilters, shouldExpand]);
  
  const { isGroupExpanded } = useUnifiedExpansionState(
    persistentExpandedGroups,
    filterBasedExpansion,
    hasActiveFilters
  );
  
  return {
    // Group expansion
    isGroupExpanded,
    toggleGroup,
    
    // Equipment expansion
    expandedEquipment: equipmentExpansion.expandedEquipment,
    toggleEquipmentExpansion: equipmentExpansion.toggleEquipmentExpansion,
    isEquipmentExpanded: equipmentExpansion.isEquipmentExpanded,
    
    // State
    hasActiveFilters,
    
    // For backward compatibility
    expandedGroups: persistentExpandedGroups
  };
}

export default {
  useUnifiedExpansionState,
  createUnifiedExpansionToggle,
  useEquipmentExpansionState,
  useAutoExpansionForFilters,
  useCompleteExpansionState
};