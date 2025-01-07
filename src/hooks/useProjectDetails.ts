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
        
        console.log('Fetching project with UUID:', projectId);

        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select(`
            *,
            crew_members (
              name
            )
          `)
          .eq('id', projectId)
          .maybeSingle();

        console.log('Query response:', { projectData, projectError });

        if (projectError) {
          console.error('Supabase error:', projectError);
          throw projectError;
        }

        if (projectData) {
          console.log('Found project:', projectData);
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
          console.log('No project found with UUID:', projectId);
          toast({
            title: "Project not found",
            description: `No project found with ID: ${projectId}`,
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