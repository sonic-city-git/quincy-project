import { Button } from "@/components/ui/button";
import { Edit, Plus } from "lucide-react";
import { AddProjectDialog } from "../dialogs/AddProjectDialog";
import { useProjects } from "@/hooks/useProjects";
import { useCommonProjectTabActions } from "../hooks/useGeneralActions";

interface ProjectActionsProps {
  selectedItems: string[];
  onProjectDeleted?: () => void;
}

export function ProjectActions({ selectedItems, onProjectDeleted }: ProjectActionsProps) {
  // PERFORMANCE OPTIMIZATION: Use consolidated dialog state management
  const { addDialog, editDialog } = useCommonProjectTabActions();
  const { projects } = useProjects();
  
  const selectedProject = projects.find(project => project.id === selectedItems[0]);

  return (
    <div className="flex items-center gap-2">
      {selectedItems.length === 1 && selectedProject && (
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => editDialog.setActive(true)}
        >
          <Edit className="h-4 w-4" />
          Edit
        </Button>
      )}
      <Button
        variant="default"
        size="sm"
        className="gap-2"
        onClick={() => addDialog.setActive(true)}
      >
        <Plus className="h-4 w-4" />
        Add Project
      </Button>
      <AddProjectDialog 
        open={addDialog.isActive}
        onOpenChange={addDialog.setActive}
      />
    </div>
  );
}