import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/projects";
import { useToast } from "@/hooks/use-toast";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data: projectsData, error } = await supabase
          .from('projects')
          .select(`
            *,
            crew_members (
              name
            )
          `)
          .order('name');  // Add this line to sort by name

        if (error) throw error;

        if (projectsData) {
          const formattedProjects = projectsData.map(project => ({
            id: project.id,
            name: project.name,
            lastInvoiced: project.last_invoiced || '',
            owner: project.crew_members?.name || 'Unknown Owner',
            color: project.color,
            gigPrice: project.gig_price || '',
            yearlyRevenue: project.yearly_revenue || ''
          }));

          setProjects(formattedProjects);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Error",
          description: "Failed to fetch projects",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [toast]);

  return { projects, loading };
}