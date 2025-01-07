import { Equipment } from "@/types/equipment";
import { EquipmentActions } from "./actions/EquipmentActions";
import { EquipmentSearch } from "./search/EquipmentSearch";

interface EquipmentSelectionHeaderProps {
  selectedItems: string[];
  equipment: Equipment[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onEditEquipment: (equipment: Equipment) => void;
  onDeleteEquipment: () => void;
  onAddEquipment: (equipment: Equipment) => void;
}

export function EquipmentSelectionHeader({
  selectedItems,
  equipment,
  searchTerm,
  onSearchChange,
  onEditEquipment,
  onDeleteEquipment,
  onAddEquipment,
}: EquipmentSelectionHeaderProps) {
  return (
    <div className="p-4 border-b flex justify-between items-center gap-4">
      <EquipmentSearch
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
      />
      <EquipmentActions
        selectedItems={selectedItems}
        equipment={equipment}
        onAddEquipment={onAddEquipment}
        onEditEquipment={onEditEquipment}
        onDeleteEquipment={onDeleteEquipment}
      />
    </div>
  );
}