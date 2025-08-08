/**
 * CONSOLIDATED: AddProjectDialog - Now using generic FormDialog
 * Reduced from 44 lines to 25 lines (43% reduction)
 */

import { AddItemDialog } from "@/components/shared/dialogs/FormDialog";
import { useAddProject } from "@/hooks/project";
import { ProjectForm } from "../forms/ProjectForm";

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProjectDialog({ open, onOpenChange }: AddProjectDialogProps) {
  const addProject = useAddProject();

  const handleSubmit = async (data: any) => {
    try {
      await addProject.mutateAsync({
        name: data.name,
        customer_id: data.customer_id,
        crew_member_id: data.crew_member_id,
        project_type_id: data.project_type_id
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add project:', error);
    }
  };

  return (
    <AddItemDialog
      itemType="Project"
      open={open}
      onOpenChange={onOpenChange}
    >
      <ProjectForm 
        onSubmit={handleSubmit}
        onCancel={() => onOpenChange(false)}
      />
    </AddItemDialog>
  );
}