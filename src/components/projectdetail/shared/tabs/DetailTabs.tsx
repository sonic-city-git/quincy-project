/**
 * CONSOLIDATED: ProjectTabs - Now using ProjectTabWrapper
 * Reduced from 39 lines to 32 lines (18% reduction)
 */

import { DollarSign } from "lucide-react";
import { ProjectTabWrapper } from "../ProjectTabWrapper";
import { ProjectTabCard } from "../ProjectTabCard";
import { ProjectGeneralTab } from "../../general/GeneralTab";
import { ResourcesTab } from "../../resources/ResourcesTab";
import { FinancialTab } from "../../financial/FinancialTab";
import { Project } from "@/types/projects";

interface DetailTabsProps {
  project: Project;
  projectId: string;
  value: string;
}

export function DetailTabs({ project, projectId, value }: DetailTabsProps) {
  return (
    <div className="flex-1">
      <ProjectTabWrapper value="general" currentTab={value}>
        <ProjectGeneralTab 
          project={project}
          projectId={projectId}
        />
      </ProjectTabWrapper>

      <ProjectTabWrapper value="resources" currentTab={value}>
        <ResourcesTab projectId={projectId} project={project} />
      </ProjectTabWrapper>

      <ProjectTabWrapper value="financial" currentTab={value}>
        <FinancialTab 
          project={project}
          projectId={projectId}
        />
      </ProjectTabWrapper>
    </div>
  );
}