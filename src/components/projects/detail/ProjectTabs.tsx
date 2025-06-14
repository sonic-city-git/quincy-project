import { TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ProjectGeneralTab } from "./ProjectGeneralTab";
import { ProjectEquipmentTab } from "./equipment/ProjectEquipmentTab";
import { ProjectCrewTab } from "./crew/ProjectCrewTab";
import { Project } from "@/types/projects";

interface ProjectTabsProps {
  project: Project;
  projectId: string;
  value: string;
}

export function ProjectTabs({ project, projectId, value }: ProjectTabsProps) {
  return (
    <div className="flex-1 overflow-hidden">
      <TabsContent value="general" className="h-full mt-0" forceMount hidden={value !== 'general'}>
        <ProjectGeneralTab 
          project={project}
          projectId={projectId}
        />
      </TabsContent>

      <TabsContent value="equipment" className="h-full mt-0" forceMount hidden={value !== 'equipment'}>
        <ProjectEquipmentTab projectId={projectId} />
      </TabsContent>

      <TabsContent value="crew" className="h-full mt-0" forceMount hidden={value !== 'crew'}>
        <ProjectCrewTab projectId={projectId} />
      </TabsContent>

      <TabsContent value="financial" className="h-full mt-0" forceMount hidden={value !== 'financial'}>
        <Card className="rounded-lg bg-zinc-800/45 p-6">
          <h2 className="text-xl font-semibold">Financial</h2>
        </Card>
      </TabsContent>
    </div>
  );
}