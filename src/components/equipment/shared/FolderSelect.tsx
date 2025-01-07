import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { EQUIPMENT_FOLDERS } from "@/data/equipmentFolders";
import { getFolderPath } from "@/utils/folderUtils";

interface FolderSelectProps {
  selectedFolder: string;
  onFolderChange: (value: string) => void;
  required?: boolean;
}

export function FolderSelect({ selectedFolder, onFolderChange, required = false }: FolderSelectProps) {
  const allFolders = EQUIPMENT_FOLDERS.flatMap(folder => [
    folder,
    ...(folder.subfolders || []).map(sub => ({
      ...sub,
      parentName: folder.name
    }))
  ]);

  return (
    <div className="grid gap-2">
      <Label htmlFor="folder">Folder</Label>
      <Select
        value={selectedFolder}
        onValueChange={onFolderChange}
        required={required}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a folder">
            {getFolderPath(selectedFolder, EQUIPMENT_FOLDERS)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {allFolders.map((folder) => (
            <SelectItem 
              key={folder.id} 
              value={folder.id}
            >
              {'parentName' in folder ? `${folder.parentName} → ${folder.name}` : folder.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}