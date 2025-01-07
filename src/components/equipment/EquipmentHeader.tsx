import { Equipment } from "@/types/equipment";
import { AddEquipmentDialog } from "./AddEquipmentDialog";
import { EquipmentFolderSelect } from "./EquipmentFolderSelect";

interface EquipmentHeaderProps {
  selectedFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onAddEquipment: (equipment: Equipment) => void;
}

export function EquipmentHeader({
  selectedFolder,
  onFolderSelect,
  onAddEquipment,
}: EquipmentHeaderProps) {
  return (
    <div className="flex justify-between items-center gap-2">
      <div className="flex items-center gap-2 flex-1">
        <EquipmentFolderSelect
          selectedFolder={selectedFolder}
          onFolderSelect={onFolderSelect}
        />
      </div>
      <AddEquipmentDialog onAddEquipment={onAddEquipment} />
    </div>
  );
}