import { Equipment } from "@/types/equipment";
import { AddEquipmentDialog } from "../AddEquipmentDialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";

interface EquipmentActionsProps {
  selectedItems: string[];
  equipment: Equipment[];
  onEditEquipment: (equipment: Equipment) => void;
  onDeleteEquipment: () => void;
}

export function EquipmentActions({
  selectedItems,
  equipment,
  onEditEquipment,
  onDeleteEquipment,
}: EquipmentActionsProps) {
  const selectedEquipment = equipment.find(item => item.id === selectedItems[0]);
  const canEdit = selectedItems.length === 1;
  const canDelete = selectedItems.length > 0;

  return (
    <div className="flex items-center gap-2">
      {canEdit && selectedEquipment && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEditEquipment(selectedEquipment)}
        >
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>
      )}
      {canDelete && (
        <Button
          variant="outline"
          size="sm"
          onClick={onDeleteEquipment}
        >
          <Trash className="h-4 w-4 mr-2" />
          Delete
        </Button>
      )}
    </div>
  );
}