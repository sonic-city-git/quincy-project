import { EquipmentSearchInput } from "./filters/EquipmentSearchInput";
import { EquipmentFilterClear } from "./filters/EquipmentFilterClear";
import { AddEquipmentDialog } from "./AddEquipmentDialog";
import { EquipmentFolderFilter } from "./filters/EquipmentFolderFilter";

interface EquipmentListHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
  selectedFolders: string[];
  onFolderToggle: (folderId: string) => void;
}

export function EquipmentListHeader({
  searchQuery,
  onSearchChange,
  onClearFilters,
  selectedFolders,
  onFolderToggle,
}: EquipmentListHeaderProps) {
  const hasActiveFilters = searchQuery.length > 0 || selectedFolders.length > 0;

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <EquipmentSearchInput 
            value={searchQuery}
            onChange={onSearchChange}
          />
          <div className="flex items-center gap-2">
            <EquipmentFolderFilter
              selectedFolders={selectedFolders}
              onFolderToggle={onFolderToggle}
            />
            {hasActiveFilters && (
              <EquipmentFilterClear onClear={onClearFilters} />
            )}
          </div>
        </div>
        <AddEquipmentDialog />
      </div>
    </div>
  );
}