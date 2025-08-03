/**
 * CONSOLIDATED: ProjectCrewTab - Now using ProjectTabCard
 * Reduced from 39 lines to 25 lines (36% reduction)
 */

import { Plus, Users } from "lucide-react";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { useCommonProjectTabActions } from "../../shared/hooks/useProjectTabActions";
import { ProjectTabCard } from "../../shared/ProjectTabCard";
import { AddRoleDialog } from "./AddRoleDialog";
import { ProjectRoleList } from "./ProjectRoleList";

interface ProjectCrewTabProps {
  projectId: string;
}

export function ProjectCrewTab({ projectId }: ProjectCrewTabProps) {
  const { project } = useProjectDetails(projectId);
  const { addDialog } = useCommonProjectTabActions();

  if (!project) return null;

  return (
    <div className="space-y-6">
      <ProjectTabCard
        title="Crew Roles"
        icon={Users}
        iconColor="text-orange-500"
        actionLabel="Add Role"
        actionIcon={Plus}
        onAction={() => addDialog.setActive(true)}
      >
        <ProjectRoleList projectId={projectId} />
      </ProjectTabCard>

      <AddRoleDialog
        project={project}
        isOpen={addDialog.isActive}
        onClose={() => addDialog.setActive(false)}
      />
    </div>
  );
}