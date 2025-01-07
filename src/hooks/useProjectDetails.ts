import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export function useProjectDetails(projectId: string | undefined) {
  const { toast } = useToast();

  const fetchProjectData = async () => {
    // Validate the project ID
    if (!projectId || projectId === ':id') {
      console.error('Invalid project ID:', projectId);
      return null;
    }

    console.log('Fetching project with UUID:', projectId);

    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        crew_members (
          id,
          name
        )
      `)
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
    enabled: !!projectId && projectId !== ':id', // Only run query if we have a valid ID
  });

  if (error) {
    console.error('Error fetching project:', error);
  }

  return { project, loading };
}