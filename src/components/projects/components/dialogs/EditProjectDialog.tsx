/**
 * EDIT PROJECT DIALOG - Following FormDialog pattern for consistency
 * Allows editing of existing project details
 */

import { EditItemDialog } from "@/components/shared/dialogs/FormDialog";
import { useUpdateProject } from "@/hooks/project";
import { ProjectForm } from "../forms/ProjectForm";
import { ProjectData } from "@/types/projects";

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectData;
}

export function EditProjectDialog({ open, onOpenChange, project }: EditProjectDialogProps) {
  const updateProject = useUpdateProject();

  const handleSubmit = async (data: any) => {
    try {
      await updateProject.mutateAsync({
        id: project.id,
        name: data.name,
        customer_id: data.customer_id,
        crew_member_id: data.crew_member_id,
        project_type_id: data.project_type_id
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  // Transform project data to form format
  const initialData = {
    name: project.name,
    customer_id: project.customer?.id || '',
    crew_member_id: project.crew_member?.id || project.owner_id || '',
    project_type_id: project.project_type_id || ''
  };

  return (
    <EditItemDialog
      itemType="Project"
      itemName={project.name}
      open={open}
      onOpenChange={onOpenChange}
    >
      <ProjectForm 
        mode="edit"
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={() => onOpenChange(false)}
      />
    </EditItemDialog>
  );
}
