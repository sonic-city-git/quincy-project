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

  // NOTE: This component is now replaced by the new VariantsContent layout
  // Keeping this component for backward compatibility but it's no longer used
  // The new layout integrates crew management in the right panel of VariantsContent
  
  return (
    <div className="p-4 bg-muted/50 border border-border rounded-lg">
      <p className="text-sm text-muted-foreground text-center">
        ⚠️ This component has been replaced by the new layout design.
        <br />
        Crew management is now handled in the VariantsContent component.
      </p>
    </div>
  );
}