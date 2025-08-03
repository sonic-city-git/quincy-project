import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/projects";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { projectBaseQuery, transformProjectData } from "@/utils/projectQueries";

export function useProjects() {

  const fetchProjects = async () => {
    console.log('Fetching projects...');
    const { data: projectsData, error } = await supabase
      .from('projects')
      .select(projectBaseQuery)
      .order('name');

    if (error) {
      console.error('Error fetching projects:', error);
      toast.error("Failed to fetch projects");
      throw error;
    }

    console.log('Raw projects data:', projectsData);
    const transformedProjects = projectsData.map(transformProjectData);
    console.log('Transformed projects:', transformedProjects);
    return transformedProjects;
  };

  const { data: projects = [], isLoading: loading } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    staleTime: 0, // Always refetch when the query is invalidated
    gcTime: 0, // Don't cache the data (formerly cacheTime)
  });

  return { projects, loading };
}