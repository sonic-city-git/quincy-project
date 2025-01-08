import { Equipment } from "@/types/equipment";
import { AddEquipmentDialog } from "./AddEquipmentDialog";
import { EquipmentFolderSelect } from "./EquipmentFolderSelect";
import { EquipmentSearch } from "./EquipmentSearch";

interface EquipmentHeaderProps {
  selectedFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onAddEquipment: (equipment: Equipment) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function EquipmentHeader({
  selectedFolder,
  onFolderSelect,
  onAddEquipment,
  searchTerm,
  onSearchChange,
}: EquipmentHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <EquipmentFolderSelect
            selectedFolder={selectedFolder}
            onFolderSelect={onFolderSelect}
          />
          <div className="w-[300px]">
            <EquipmentSearch
              searchTerm={searchTerm}
              onSearchChange={onSearchChange}
            />
          </div>
        </div>
        <AddEquipmentDialog onAddEquipment={onAddEquipment} />
      </div>
    </div>
  );
}