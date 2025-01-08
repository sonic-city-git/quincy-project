import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { DeleteCrewMemberButton } from "@/components/crew/edit/DeleteCrewMemberButton";

interface RoleSelectionActionsProps {
  selectedItems: string[];
  onEdit: (roleId: string) => void;
  onDelete: (roleId: string) => void;
}

export function RoleSelectionActions({ selectedItems, onEdit, onDelete }: RoleSelectionActionsProps) {
  if (selectedItems.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {selectedItems.length === 1 && (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(selectedItems[0])}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <DeleteCrewMemberButton
            onDelete={() => onDelete(selectedItems[0])}
          />
        </>
      )}
    </div>
  );
}