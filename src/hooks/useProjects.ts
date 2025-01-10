import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/projects";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export function useProjects() {
  const { toast } = useToast();

  const fetchProjects = async () => {
    console.log('Fetching projects...');
    const { data: projectsData, error } = await supabase
      .from('projects')
      .select(`
        *,
        customers (
          id,
          name
        ),
        crew_members!owner_id_fkey (
          id,
          name
        )
      `)
      .order('name');

    if (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive",
      });
      throw error;
    }

    console.log('Projects data:', projectsData);

    return projectsData.map(project => ({
      id: project.id,
      name: project.name,
      customer_id: project.customer_id,
      lastInvoiced: project.created_at || '',
      owner: project.crew_members?.name || project.customers?.name || 'No Owner',
      owner_id: project.owner_id,
      status: project.status || 'draft',
      color: 'blue', // Default color for now
      crew_member_id: project.owner_id
    })) as Project[];
  };

  const { data: projects = [], isLoading: loading } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  return { projects, loading };
}