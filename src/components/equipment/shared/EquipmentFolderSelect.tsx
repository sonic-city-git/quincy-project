import { useEffect, useState } from "react";
import { EquipmentFolder } from "@/types/equipment";
import { EQUIPMENT_FOLDERS } from "@/data/equipmentFolders";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface EquipmentFolderSelectProps {
  selectedFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
}

export function EquipmentFolderSelect({ selectedFolder, onFolderSelect }: EquipmentFolderSelectProps) {
  const [folders, setFolders] = useState<EquipmentFolder[]>(EQUIPMENT_FOLDERS);

  useEffect(() => {
    // You can fetch folders from an API or database if needed
    // setFolders(fetchedFolders);
  }, []);

  return (
    <div className="w-64">
      <Label>Folder</Label>
      <Select value={selectedFolder || ""} onValueChange={onFolderSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Select a folder" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>All</SelectItem>
          {folders.map(folder => (
            <SelectItem key={folder.id} value={folder.id}>
              {folder.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
