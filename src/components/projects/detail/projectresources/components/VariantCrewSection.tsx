/**
 * Variant Crew Section - Copy of original ProjectCrewTab with variant support
 */

import { Plus, Users } from "lucide-react";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { useCommonProjectTabActions } from "../../../shared/hooks/useProjectTabActions";
import { ProjectTabCard } from "../../../shared/ProjectTabCard";
import { AddRoleDialog } from "../../crew/AddRoleDialog";
import { ProjectRoleList } from "../../crew/ProjectRoleList";

interface VariantCrewSectionProps {
  projectId: string;
  variantName: string;
}

export function VariantCrewSection({ projectId, variantName }: VariantCrewSectionProps) {
  const { project } = useProjectDetails(projectId);
  const { addDialog } = useCommonProjectTabActions();

  if (!project) return null;

  return (
    <ProjectTabCard
      title="Crew Roles"
      icon={Users}
      iconColor="text-orange-500"
      actionLabel="Add Role"
      actionIcon={Plus}
      onAction={() => addDialog.setActive(true)}
      className="flex-[6]"
    >
      <ProjectRoleList projectId={projectId} />
      
      <AddRoleDialog
        project={project}
        isOpen={addDialog.isActive}
        onClose={() => addDialog.setActive(false)}
      />
    </ProjectTabCard>
  );
}