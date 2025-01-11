import { useState, useMemo } from "react";
import { Project } from "@/types/projects";

interface FilterConfig {
  searchFields?: (keyof Project)[];
  defaultOwnerFilter?: string;
}

export function useProjectFilters(
  projects: Project[],
  config: FilterConfig = {
    searchFields: ['name', 'owner'],
    defaultOwnerFilter: ''
  }
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [ownerFilter, setOwnerFilter] = useState(config.defaultOwnerFilter || '');

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Search filter
      const matchesSearch = config.searchFields?.some(field => {
        const value = project[field];
        return value?.toString().toLowerCase().includes(searchQuery.toLowerCase());
      }) ?? true;
      
      // Owner filter
      const matchesOwner = !ownerFilter || project.owner_id === ownerFilter;
      
      return matchesSearch && matchesOwner;
    });
  }, [projects, searchQuery, ownerFilter, config.searchFields]);

  return {
    searchQuery,
    setSearchQuery,
    ownerFilter,
    setOwnerFilter,
    filteredProjects
  };
}