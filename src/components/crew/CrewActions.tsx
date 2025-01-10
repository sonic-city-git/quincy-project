import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { useState } from "react";
import { EditMemberDialog } from "./EditMemberDialog";
import { useCrew } from "@/hooks/useCrew";

interface CrewActionsProps {
  selectedItems: string[];
  onCrewMemberDeleted?: () => void;
}

export function CrewActions({ selectedItems, onCrewMemberDeleted }: CrewActionsProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { crew } = useCrew();
  
  const selectedMember = crew.find(member => member.id === selectedItems[0]);

  return (
    <div className="flex items-center gap-2">
      {selectedItems.length === 1 && selectedMember && (
        <>
          <Button 
            variant="outline" 
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setEditDialogOpen(true)}
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <EditMemberDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            member={selectedMember}
            onCrewMemberDeleted={onCrewMemberDeleted}
          />
        </>
      )}
    </div>
  );
}