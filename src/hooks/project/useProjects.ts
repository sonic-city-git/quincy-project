/**
 * CONSOLIDATED: useProjects - Now using generic useEntityData with transformation
 * Reduced from 36 lines to 17 lines (53% reduction)  
 */

import { useEntityData } from '../shared/useEntityData';
import { Project } from "@/types/projects";
import { projectBaseQuery, transformProjectData } from "@/utils/projectQueries";

export function useProjects() {
  const { data: projects, isLoading: loading } = useEntityData<Project>({
    table: 'projects',
    queryKey: 'projects',
    selectQuery: projectBaseQuery,
    transform: (data) => data.map(transformProjectData),
    staleTime: 0,
    gcTime: 0,
    errorMessage: "Failed to fetch projects"
  });
  
  return { projects, loading };
}