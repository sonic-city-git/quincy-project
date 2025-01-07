import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { ProjectGeneralTab } from "@/components/projects/ProjectGeneralTab";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProjectData {
  name: string;
  last_invoiced: string;
  owner: string;
  customer: string | null;
  color: string;
  gig_price: string | null;
  yearly_revenue: string | null;
}

const ProjectDetails = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        if (!projectId) return;

        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select(`
            *,
            crew_members (
              name
            )
          `)
          .eq('id', projectId)
          .single();

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

  if (loading) {
    return (
      <div className="p-6">
        <p>Loading...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold">Project not found</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ProjectHeader 
        name={project.name}
        lastInvoiced={project.last_invoiced}
        color={project.color}
      />

      <div className="max-w-7xl mx-auto px-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="crew">Crew</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <ProjectGeneralTab 
              projectId={projectId || ""}
              initialOwner={project.owner}
              initialCustomer={project.customer || ""}
              gigPrice={project.gig_price || ""}
              yearlyRevenue={project.yearly_revenue || ""}
            />
          </TabsContent>

          <TabsContent value="equipment">
            <div className="text-sm text-muted-foreground">
              Equipment content coming soon...
            </div>
          </TabsContent>

          <TabsContent value="crew">
            <div className="text-sm text-muted-foreground">
              Crew content coming soon...
            </div>
          </TabsContent>

          <TabsContent value="financial">
            <div className="text-sm text-muted-foreground">
              Financial content coming soon...
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectDetails;