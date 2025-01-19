import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAddProject } from "@/hooks/useAddProject";
import { ProjectForm } from "./forms/ProjectForm";

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new project.
          </DialogDescription>
        </DialogHeader>

        <ProjectForm 
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}