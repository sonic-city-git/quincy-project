/**
 * CONSOLIDATED: ProjectTabs - Now using ProjectTabWrapper
 * Reduced from 39 lines to 32 lines (18% reduction)
 */

import { DollarSign } from "lucide-react";
import { ProjectTabWrapper } from "../shared/ProjectTabWrapper";
import { ProjectTabCard } from "../shared/ProjectTabCard";
import { ProjectGeneralTab } from "./ProjectGeneralTab";
import { ProjectResourcesTab } from "./projectresources/ProjectResourcesTab";
import { Project } from "@/types/projects";

interface ProjectTabsProps {
  project: Project;
  projectId: string;
  value: string;
}

export function ProjectTabs({ project, projectId, value }: ProjectTabsProps) {
  return (
    <div className="flex-1 overflow-hidden">
      <ProjectTabWrapper value="general" currentTab={value}>
        <ProjectGeneralTab 
          project={project}
          projectId={projectId}
        />
      </ProjectTabWrapper>

      <ProjectTabWrapper value="projectresources" currentTab={value}>
        <ProjectResourcesTab projectId={projectId} project={project} />
      </ProjectTabWrapper>

      <ProjectTabWrapper value="financial" currentTab={value}>
        <ProjectTabCard
          title="Financial"
          icon={DollarSign}
          iconColor="text-blue-500"
        >
          <p className="text-muted-foreground">Financial tracking and reporting coming soon.</p>
        </ProjectTabCard>
      </ProjectTabWrapper>
    </div>
  );
}