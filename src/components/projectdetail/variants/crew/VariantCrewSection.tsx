/**
 * Variant Crew Section - Compact crew roles for variant view
 */

import { Plus, Users } from "lucide-react";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { useCommonProjectTabActions } from "../../general/shared/hooks/useGeneralActions";
import { AddRoleDialog } from "./components/AddRoleDialog";
import { CompactCrewRolesList } from "./components/CompactCrewRolesList";
import { Button } from "@/components/ui/button";

interface VariantCrewSectionProps {
  projectId: string;
  variantName: string;
}

export function VariantCrewSection({ projectId, variantName }: VariantCrewSectionProps) {
  const { project } = useProjectDetails(projectId);
  const { addDialog } = useCommonProjectTabActions();

  if (!project) return null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-orange-500" />
          <h3 className="text-sm font-medium">Crew Roles</h3>
        </div>
        <Button
          variant="ghost" 
          size="sm"
          onClick={() => addDialog.setActive(true)}
          className="h-8 px-2 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Role
        </Button>
      </div>

      {/* Compact Crew List */}
      <CompactCrewRolesList projectId={projectId} variantName={variantName} />
      
      <AddRoleDialog
        project={project}
        variantName={variantName}
        isOpen={addDialog.isActive}
        onClose={() => addDialog.setActive(false)}
      />
    </div>
  );
}