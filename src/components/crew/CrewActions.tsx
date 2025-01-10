import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface CrewActionsProps {
  selectedItems: string[];
  onCrewMemberDeleted?: () => void;
}

export function CrewActions({ selectedItems }: CrewActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {selectedItems.length > 0 && (
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Edit className="h-4 w-4" />
          Edit
        </Button>
      )}
    </div>
  );
}