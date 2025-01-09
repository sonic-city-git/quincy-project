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
        customer:customers(
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
      lastInvoiced: project.start_date || '',
      owner: project.customer?.name || 'No Customer',
      owner_id: project.customer_id,
      status: project.status || 'draft',
      color: 'blue', // Default color for now
      gigPrice: project.project_number || '',
      yearlyRevenue: project.description || ''
    })) as Project[];
  };

  const { data: projects = [], isLoading: loading } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  return { projects, loading };
}