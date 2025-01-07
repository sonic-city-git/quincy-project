import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProjectData } from "@/types/projectDetails";
import { useToast } from "@/hooks/use-toast";

export function useProjectDetails(projectId: string | undefined) {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        if (!projectId) return;

        // Replace hyphens with spaces for the database query
        const formattedProjectId = projectId.replace(/-/g, ' ');

        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select(`
            *,
            crew_members (
              name
            )
          `)
          .eq('id', formattedProjectId)
          .maybeSingle();

        if (projectError) throw projectError;

        if (projectData) {
          setProject({
            name: projectData.name,
            last_invoiced: projectData.last_invoiced || '',
            owner: projectData.crew_members?.name || '',
            customer: projectData.customer,
            color: projectData.color,
            gig_price: projectData.gig_price,
            yearly_revenue: projectData.yearly_revenue
          });
        } else {
          // Handle case when no project is found
          toast({
            title: "Project not found",
            description: "The requested project could not be found.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching project:', error);
        toast({
          title: "Error",
          description: "Failed to fetch project details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId, toast]);

  return { project, loading };
}