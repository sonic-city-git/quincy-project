import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { AddMemberDialog } from "./AddMemberDialog";

interface CrewActionsProps {
  selectedItems: string[];
  onCrewMemberDeleted?: () => void;
}

export function CrewActions({ selectedItems, onCrewMemberDeleted }: CrewActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <AddMemberDialog />
      {selectedItems.length > 0 && (
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2 text-destructive hover:text-destructive"
        >
          <Trash className="h-4 w-4" />
          Delete
        </Button>
      )}
    </div>
  );
}