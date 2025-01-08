import { Equipment } from "@/types/equipment";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";

interface EquipmentActionsProps {
  selectedItems: string[];
  equipment: Equipment | undefined;
  onEdit: (equipment: Equipment) => void;
  onDelete: () => void;
}

export function EquipmentActions({
  selectedItems,
  equipment,
  onEdit,
  onDelete,
}: EquipmentActionsProps) {
  if (!equipment || selectedItems.length !== 1) {
    return (
      <Button
        variant="destructive"
        size="sm"
        onClick={onDelete}
        className="h-8"
      >
        <Trash className="h-4 w-4 mr-2" />
        Delete
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onEdit(equipment)}
        className="h-8"
      >
        <Edit className="h-4 w-4 mr-2" />
        Edit
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={onDelete}
        className="h-8"
      >
        <Trash className="h-4 w-4 mr-2" />
        Delete
      </Button>
    </div>
  );
}