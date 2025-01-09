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
      lastInvoiced: project.last_invoiced || '',
      owner: project.customer?.name || 'No Customer',
      owner_id: project.customer_id,
      color: 'blue', // Default color for now
      gigPrice: project.invoice_reference || '',
      yearlyRevenue: project.cost_center || ''
    }));
  };

  const { data: projects = [], isLoading: loading } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  return { projects, loading };
}