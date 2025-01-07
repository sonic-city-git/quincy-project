import { EditEquipmentDialog } from "./EditEquipmentDialog";
import { EquipmentSearch } from "./EquipmentSearch";
import { Equipment } from "@/types/equipment";

interface EquipmentSelectionHeaderProps {
  selectedItems: string[];
  equipment: Equipment[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onEditEquipment: (equipment: Equipment) => void;
  onDeleteEquipment: () => void;
}

export function EquipmentSelectionHeader({
  selectedItems,
  equipment,
  searchTerm,
  onSearchChange,
  onEditEquipment,
  onDeleteEquipment
}: EquipmentSelectionHeaderProps) {
  return (
    <div className="h-[48px] border-b border-zinc-800/50">
      <div className="h-full flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className={`text-sm text-zinc-400 transition-opacity duration-200 ${selectedItems.length === 0 ? 'opacity-0' : 'opacity-100'}`}>
            {selectedItems.length} items selected
          </span>
          {selectedItems.length === 1 && (
            <EditEquipmentDialog 
              equipment={equipment.find(item => item.id === selectedItems[0])!}
              onEditEquipment={onEditEquipment}
              onDeleteEquipment={onDeleteEquipment}
            />
          )}
        </div>
        <div className="w-64">
          <EquipmentSearch 
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
          />
        </div>
      </div>
    </div>
  );
}