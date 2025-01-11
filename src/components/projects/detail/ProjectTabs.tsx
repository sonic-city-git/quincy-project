import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ProjectGeneralTab } from "./ProjectGeneralTab";
import { Project } from "@/types/projects";

interface ProjectTabsProps {
  project: Project;
  projectId: string;
}

export function ProjectTabs({ project, projectId }: ProjectTabsProps) {
  return (
    <Tabs defaultValue="general" className="w-full">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="crew">Crew</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="general">
        <ProjectGeneralTab 
          project={project}
          projectId={projectId}
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
  );
}