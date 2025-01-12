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
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-background z-10 p-8 pb-0">
        <div className="flex items-center justify-between mb-4">
          <ProjectHeader 
            name={project.name}
            color={project.color}
            projectNumber={project.project_number}
          />
        </div>
        
        <ProjectTabs project={project} projectId={projectId} />
      </div>
    </div>
  );
}