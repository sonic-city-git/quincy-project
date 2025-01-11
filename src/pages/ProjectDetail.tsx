import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "@/utils/eventQueries";
import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";
import { ProjectHeader } from "@/components/projects/detail/ProjectHeader";
import { ProjectGeneralTab } from "@/components/projects/detail/ProjectGeneralTab";
import { useToast } from "@/hooks/use-toast";

const ProjectDetail = () => {
  const { id } = useParams();
  const { project, loading } = useProjectDetails(id);
  const { toast } = useToast();
  
  const { data: events } = useQuery({
    queryKey: ['events', id],
    queryFn: () => fetchEvents(id || ''),
    enabled: !!id
  });

  const handleInvoice = () => {
    toast({
      title: "Invoice Generation",
      description: "Invoice generation started...",
    });
    // Additional invoice logic here
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!project) {
    return <div className="p-8">Project not found</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-background z-10 p-8 pb-0 space-y-6">
        <ProjectHeader 
          name={project.name}
          color={project.color}
          projectNumber={project.project_number}
        />
        
        <Tabs defaultValue="general" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="equipment">Equipment</TabsTrigger>
              <TabsTrigger value="crew">Crew</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
            </TabsList>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleInvoice}
            >
              <Receipt className="h-4 w-4" />
              Invoice
            </Button>
          </div>

          <TabsContent value="general">
            <ProjectGeneralTab 
              project={project}
              events={events || []}
              projectId={id || ''}
            />
          </TabsContent>

          <TabsContent value="equipment">
            <Card className="p-6">
              <h2 className="text-xl font-semibold">Equipment</h2>
            </Card>
          </TabsContent>

          <TabsContent value="crew">
            <Card className="p-6">
              <h2 className="text-xl font-semibold">Crew</h2>
            </Card>
          </TabsContent>

          <TabsContent value="financial">
            <Card className="p-6">
              <h2 className="text-xl font-semibold">Financial</h2>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectDetail;