import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AddRoleDialog } from "./AddRoleDialog";
import { ProjectRoleList } from "./ProjectRoleList";
import { useProjectDetails } from "@/hooks/useProjectDetails";

interface ProjectCrewTabProps {
  projectId: string;
}

export function ProjectCrewTab({ projectId }: ProjectCrewTabProps) {
  const [isAddingRole, setIsAddingRole] = useState(false);
  const { project } = useProjectDetails(projectId);

  if (!project) return null;

  return (
    <div className="space-y-6">
      <Card className="rounded-lg bg-zinc-800/45 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Crew Roles</h2>
          <Button onClick={() => setIsAddingRole(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Role
          </Button>
        </div>
        <ProjectRoleList projectId={projectId} />
      </Card>

      <AddRoleDialog
        project={project}
        isOpen={isAddingRole}
        onClose={() => setIsAddingRole(false)}
      />
    </div>
  );
}