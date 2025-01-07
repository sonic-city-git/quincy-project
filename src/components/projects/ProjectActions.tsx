import { Button } from "@/components/ui/button";
import { Copy, Plus, Trash } from "lucide-react";

export function ProjectActions() {
  return (
    <div className="flex justify-between">
      <div className="flex gap-2">
        <Button variant="secondary" className="gap-2">
          <Copy className="h-4 w-4" />
          Duplicate Project
        </Button>
        <Button variant="secondary" className="gap-2">
          <Trash className="h-4 w-4" />
          Delete Project
        </Button>
      </div>
      <Button variant="secondary" className="gap-2">
        <Plus className="h-4 w-4" />
        New Project
      </Button>
    </div>
  );
}