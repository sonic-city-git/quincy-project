/**
 * Shared Toggle Group Handler Hook
 * 
 * Eliminates duplicate toggle group logic between useEquipmentHub and useCrewHub
 */

import { useCallback } from 'react';

interface ToggleGroupConfig {
  groups: Array<{ mainFolder: string; subFolders?: Array<{ name: string }> }>;
  toggleGroupPersistent: (groupKey: string, expandAllSubfolders?: boolean, subFolderKeys?: string[]) => void;
}

/**
 * Creates a toggle group handler with subfolder support
 */
export function useToggleGroupHandler({
  groups,
  toggleGroupPersistent
}: ToggleGroupConfig) {
  
  const toggleGroup = useCallback((groupKey: string, expandAllSubfolders?: boolean) => {
    if (expandAllSubfolders) {
      const group = groups.find(g => g.mainFolder === groupKey);
      const subFolderKeys = group?.subFolders?.map(
        (subFolder) => `${groupKey}/${subFolder.name}`
      ) || [];
      
      toggleGroupPersistent(groupKey, expandAllSubfolders, subFolderKeys);
    } else {
      toggleGroupPersistent(groupKey, false);
    }
  }, [groups, toggleGroupPersistent]);

  return toggleGroup;
}