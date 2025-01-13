import { ProjectHeader } from "../ProjectHeader";
import { ProjectTabs } from "../ProjectTabs";
import { Project } from "@/types/projects";
import { Tabs } from "@/components/ui/tabs";
import { useState } from "react";

interface ProjectLayoutProps {
  project: Project;
  projectId: string;
}

export function ProjectLayout({ 
  project, 
  projectId,
}: ProjectLayoutProps) {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="min-h-[calc(100vh-1rem)]">
      <div className="bg-zinc-900 rounded-lg shadow-md">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col">
            <div className="sticky top-0 z-10 bg-zinc-900 rounded-t-lg">
              <div className="p-4">
                <ProjectHeader 
                  name={project.name}
                  color={project.color}
                  projectNumber={project.project_number}
                  defaultValue={activeTab}
                />
              </div>
            </div>
            
            <div className="px-6 pb-6">
              <ProjectTabs 
                project={project} 
                projectId={projectId}
                value={activeTab}
              />
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}