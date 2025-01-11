import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { projectBaseQuery } from "@/utils/projectQueries";

export function useProjectDetails(projectId: string | undefined) {
  const { toast } = useToast();

  const fetchProjectData = async () => {
    if (!projectId || projectId === ':id') {
      console.error('Invalid project ID:', projectId);
      return null;
    }

    console.log('Fetching project with UUID:', projectId);

    const { data, error } = await supabase
      .from('projects')
      .select(projectBaseQuery)
      .eq('id', projectId)
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch project details",
        variant: "destructive",
      });
      throw error;
    }

    console.log('Query response:', { projectData: data, projectError: error });
    return data;
  };

  const { data: project, isLoading: loading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: fetchProjectData,
    enabled: !!projectId && projectId !== ':id',
  });

  if (error) {
    console.error('Error fetching project:', error);
  }

  return { project, loading };
}