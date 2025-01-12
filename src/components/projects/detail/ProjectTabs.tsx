import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ProjectGeneralTab } from "./ProjectGeneralTab";
import { ProjectEquipmentTab } from "./equipment/ProjectEquipmentTab";
import { Project } from "@/types/projects";

interface ProjectTabsProps {
  project: Project;
  projectId: string;
}

export function ProjectTabs({ project, projectId }: ProjectTabsProps) {
  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="bg-zinc-800/45 p-1 rounded-lg h-full">
        <TabsTrigger 
          value="general" 
          className="data-[state=active]:bg-zinc-900/90 data-[state=active]:text-accent transition-colors"
        >
          General
        </TabsTrigger>
        <TabsTrigger 
          value="equipment"
          className="data-[state=active]:bg-zinc-900/90 data-[state=active]:text-accent transition-colors"
        >
          Equipment
        </TabsTrigger>
        <TabsTrigger 
          value="crew"
          className="data-[state=active]:bg-zinc-900/90 data-[state=active]:text-accent transition-colors"
        >
          Crew
        </TabsTrigger>
        <TabsTrigger 
          value="financial"
          className="data-[state=active]:bg-zinc-900/90 data-[state=active]:text-accent transition-colors"
        >
          Financial
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="mt-8">
        <ProjectGeneralTab 
          project={project}
          projectId={projectId}
        />
      </TabsContent>

      <TabsContent value="equipment" className="mt-8">
        <ProjectEquipmentTab projectId={projectId} />
      </TabsContent>

      <TabsContent value="crew" className="mt-8">
        <Card className="rounded-lg bg-zinc-800/45 p-6">
          <h2 className="text-xl font-semibold">Crew</h2>
        </Card>
      </TabsContent>

      <TabsContent value="financial" className="mt-8">
        <Card className="rounded-lg bg-zinc-800/45 p-6">
          <h2 className="text-xl font-semibold">Financial</h2>
        </Card>
      </TabsContent>
    </Tabs>
  );
}