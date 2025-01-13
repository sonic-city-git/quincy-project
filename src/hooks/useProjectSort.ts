import { Project } from "@/types/projects";

export function useProjectSort() {
  const sortProjects = (projects: Project[]) => {
    return [...projects].sort((a, b) => {
      // First sort by owner name
      const ownerA = a.owner?.name?.toLowerCase() || '';
      const ownerB = b.owner?.name?.toLowerCase() || '';
      
      if (ownerA !== ownerB) {
        return ownerA.localeCompare(ownerB);
      }
      
      // Then sort alphabetically by project name
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
  };

  return { sortProjects };
}