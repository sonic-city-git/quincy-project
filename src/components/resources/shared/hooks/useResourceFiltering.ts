/**
 * CONSOLIDATED: useResourceFiltering - Eliminates filter duplication
 * 
 * Replaces similar filtering logic across ResourceCrewTable and ResourceEquipmentTable
 * Provides unified filtering patterns for different resource types
 */

import { useMemo } from 'react';
import { ResourceFilters } from '../../ResourcesHeader';

export interface FilterableResource {
  id: string;
  name: string;
  folder_id?: string;
  roles?: string[];
}

export interface FilterOptions {
  folders?: Array<{ id: string; name: string; parent_id?: string | null }>;
}

/**
 * Generic resource filtering hook that works for both crew and equipment
 */
export function useResourceFiltering<T extends FilterableResource>(
  resources: T[],
  filters: ResourceFilters,
  resourceType: 'crew' | 'equipment',
  options: FilterOptions = {}
) {
  return useMemo(() => {
    return resources.filter(resource => {
      // Universal search filter
      const matchesSearch = filters.search
        ? resource.name.toLowerCase().includes(filters.search.toLowerCase())
        : true;

      // Type-specific filtering
      let matchesTypeFilter = true;

      if (resourceType === 'crew') {
        // Crew role filtering
        matchesTypeFilter = filters.crewRole && filters.crewRole !== 'all'
          ? resource.roles?.includes(filters.crewRole) || false
          : true;
      } else if (resourceType === 'equipment') {
        // Equipment type/folder filtering
        if (filters.equipmentType && filters.equipmentType !== 'all' && options.folders) {
          const folder = options.folders.find(f => f.id === resource.folder_id);
          const parentFolder = folder?.parent_id 
            ? options.folders.find(f => f.id === folder.parent_id)
            : null;
          const folderName = parentFolder?.name || folder?.name || 'Uncategorized';
          matchesTypeFilter = folderName === filters.equipmentType;
        }
      }

      return matchesSearch && matchesTypeFilter;
    });
  }, [resources, filters, resourceType, options.folders]);
}