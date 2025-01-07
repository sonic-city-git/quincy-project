import { Button } from "@/components/ui/button";
import { Plus, Copy, Trash } from "lucide-react";

interface ProjectActionsProps {
  selectedItems?: string[];
}

export function ProjectActions({ selectedItems = [] }: ProjectActionsProps) {
  const hasSelection = selectedItems.length > 0;

  return (
    <div className="flex items-center gap-2">
      {hasSelection && (
        <>
          <Button variant="secondary" className="gap-2">
            <Copy className="h-4 w-4" />
            Duplicate Project
          </Button>
          <Button variant="secondary" className="gap-2">
            <Trash className="h-4 w-4" />
            Delete Project
          </Button>
        </>
      )}
      <Button variant="secondary" className="gap-2 ml-auto">
        <Plus className="h-4 w-4" />
        New Project
      </Button>
    </div>
  );
}