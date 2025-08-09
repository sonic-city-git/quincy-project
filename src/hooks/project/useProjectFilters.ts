import { Project } from "@/types/projects";
import { useState, useMemo } from "react";

export function useProjectFilters(projects: Project[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");

  const filteredProjects = useMemo(() => {
    return projects
      .filter(project => !project.is_archived) // Filter out archived projects
      .filter(project => {
        const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesOwner = !ownerFilter || project.owner?.name === ownerFilter;
        return matchesSearch && matchesOwner;
      });
  }, [projects, searchQuery, ownerFilter]);

  return {
    searchQuery,
    setSearchQuery,
    ownerFilter,
    setOwnerFilter,
    filteredProjects,
  };
}