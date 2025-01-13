import { ProjectHeader } from "../ProjectHeader";
import { ProjectTabs } from "../ProjectTabs";
import { Project } from "@/types/projects";

interface ProjectLayoutProps {
  project: Project;
  projectId: string;
}

export function ProjectLayout({ 
  project, 
  projectId,
}: ProjectLayoutProps) {
  return (
    <div className="h-[calc(100vh-2rem)] py-6">
      <div className="bg-zinc-900/50 rounded-lg shadow-md h-full">
        <div className="p-6 h-full flex flex-col">
          <div className="flex-shrink-0 mb-4">
            <ProjectHeader 
              name={project.name}
              color={project.color}
              projectNumber={project.project_number}
            />
          </div>
          
          <div className="flex-1 overflow-auto">
            <ProjectTabs project={project} projectId={projectId} />
          </div>
        </div>
      </div>
    </div>
  );
}