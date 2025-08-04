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
