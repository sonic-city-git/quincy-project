import { useState } from "react";
import { Project } from "@/types/projects";

export function useProjectFilters(projects: Project[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.owner && project.owner.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesOwner = !ownerFilter || project.owner_id === ownerFilter;
    
    return matchesSearch && matchesOwner;
  });

  return {
    searchQuery,
    setSearchQuery,
    ownerFilter,
    setOwnerFilter,
    filteredProjects
  };
}