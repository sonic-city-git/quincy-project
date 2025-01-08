import { Equipment } from "@/types/equipment";
import { EquipmentActions } from "./EquipmentActions";

interface EquipmentSelectionActionsProps {
  selectedItems: string[];
  equipment: Equipment[];
  onEditEquipment: (equipment: Equipment) => void;
  onDeleteEquipment: () => void;
}

export function EquipmentSelectionActions({
  selectedItems,
  equipment,
  onEditEquipment,
  onDeleteEquipment,
}: EquipmentSelectionActionsProps) {
  if (selectedItems.length === 0) {
    return null;
  }

  const selectedEquipment = equipment.find(item => item.id === selectedItems[0]);

  return (
    <div className="p-4 border-b border-zinc-800">
      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-400">
          {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
        </div>
        <EquipmentActions
          selectedItems={selectedItems}
          equipment={selectedEquipment}
          onEdit={onEditEquipment}
          onDelete={onDeleteEquipment}
        />
      </div>
    </div>
  );
}