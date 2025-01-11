import { EquipmentSearchInput } from "./filters/EquipmentSearchInput";
import { EquipmentFilterClear } from "./filters/EquipmentFilterClear";
import { EquipmentActions } from "./EquipmentActions";
import { AddEquipmentDialog } from "./AddEquipmentDialog";

interface EquipmentListHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
  selectedItem: string | null;
  onEquipmentDeleted: () => void;
}

export function EquipmentListHeader({
  searchQuery,
  onSearchChange,
  onClearFilters,
  selectedItem,
  onEquipmentDeleted,
}: EquipmentListHeaderProps) {
  const hasActiveFilters = searchQuery.length > 0;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 flex-1">
        <EquipmentSearchInput 
          value={searchQuery}
          onChange={onSearchChange}
        />
        {hasActiveFilters && (
          <EquipmentFilterClear onClear={onClearFilters} />
        )}
      </div>
      <EquipmentActions 
        selectedItems={selectedItem ? [selectedItem] : []} 
        onEquipmentDeleted={onEquipmentDeleted}
      />
      <AddEquipmentDialog />
    </div>
  );
}