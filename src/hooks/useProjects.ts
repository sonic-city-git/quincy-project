import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/projects";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export function useProjects() {
  const { toast } = useToast();

  const fetchProjects = async () => {
    const { data: projectsData, error } = await supabase
      .from('projects')
      .select(`
        *,
        crew_members (
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

    return projectsData.map(project => ({
      id: project.id,
      name: project.name,
      lastInvoiced: project.last_invoiced || '',
      owner: project.crew_members?.name || 'Unknown Owner',
      owner_id: project.owner_id,
      color: project.color,
      gigPrice: project.gig_price || '',
      yearlyRevenue: project.yearly_revenue || ''
    }));
  };

  const { data: projects = [], isLoading: loading } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  return { projects, loading };
}