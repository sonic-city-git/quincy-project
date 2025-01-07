import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectGeneralTab } from "@/components/projects/ProjectGeneralTab";
import { ProjectData } from "@/types/projectDetails";

interface ProjectTabsProps {
  projectId: string;
  project: ProjectData;
}

export function ProjectTabs({ projectId, project }: ProjectTabsProps) {
  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="equipment">Equipment</TabsTrigger>
        <TabsTrigger value="crew">Crew</TabsTrigger>
        <TabsTrigger value="financial">Financial</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <ProjectGeneralTab 
          projectId={projectId}
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
  );
}