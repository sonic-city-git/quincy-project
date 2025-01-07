import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EQUIPMENT_FOLDERS } from "@/data/equipmentFolders";
import { getFolderPath } from "@/utils/folderUtils";

interface FolderSelectProps {
  selectedFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
  required?: boolean;
  showAllFolders?: boolean;
}

export function FolderSelect({
  selectedFolder,
  onFolderSelect,
  required = false,
  showAllFolders = true,
}: FolderSelectProps) {
  const renderFolderOptions = (folders: typeof EQUIPMENT_FOLDERS, level = 0) => {
    return folders.map((folder) => (
      <div key={folder.id}>
        <SelectItem
          value={folder.id}
          className={`${level > 0 ? "pl-6 italic" : ""}`}
        >
          {folder.name}
        </SelectItem>
        {folder.subfolders && renderFolderOptions(folder.subfolders, level + 1)}
      </div>
    ));
  };

  return (
    <Select
      value={selectedFolder || undefined}
      onValueChange={(value) => onFolderSelect(value)}
      required={required}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select folder">
          {getFolderPath(selectedFolder, EQUIPMENT_FOLDERS)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="h-[400px]">
        <ScrollArea className="h-full w-full rounded-md" type="hover">
          {showAllFolders && <SelectItem value="all">All folders</SelectItem>}
          {renderFolderOptions(EQUIPMENT_FOLDERS)}
        </ScrollArea>
      </SelectContent>
    </Select>
  );
}