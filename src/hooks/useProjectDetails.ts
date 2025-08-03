import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { projectBaseQuery } from "@/utils/projectQueries";

export function useProjectDetails(projectId: string | undefined) {

  const fetchProjectData = async () => {
    if (!projectId || projectId === ':id') {
      console.error('Invalid project ID:', projectId);
      return null;
    }

    const { data, error } = await supabase
      .from('projects')
      .select(projectBaseQuery)
      .eq('id', projectId)
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      toast.error("Failed to fetch project details");
      throw error;
    }
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