import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EQUIPMENT_FOLDERS } from "@/data/equipmentFolders";
import { getFolderPath } from "@/utils/folderUtils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FolderSelectProps {
  selectedFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
  required?: boolean;
  showAllFolders?: boolean;
}

export function FolderSelect({ 
  selectedFolder, 
  onFolderSelect, 
  required,
  showAllFolders = true 
}: FolderSelectProps) {
  const renderFolderOptions = (folders: typeof EQUIPMENT_FOLDERS, level = 0) => {
    return folders.map((folder) => (
      <React.Fragment key={folder.id}>
        <SelectItem
          value={folder.id}
          className={`${level > 0 ? 'italic' : ''}`}
          style={{ paddingLeft: level > 0 ? `${level * 16 + 8}px` : '8px' }}
        >
          {folder.name}
        </SelectItem>
        {folder.subfolders && renderFolderOptions(folder.subfolders, level + 1)}
      </React.Fragment>
    ));
  };

  return (
    <Select
      value={selectedFolder || "all"}
      onValueChange={(value) => onFolderSelect(value === "all" ? null : value)}
      required={required}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue>
          {getFolderPath(selectedFolder, EQUIPMENT_FOLDERS)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <ScrollArea className="h-[200px] w-full rounded-md">
          {showAllFolders && <SelectItem value="all">All folders</SelectItem>}
          {renderFolderOptions(EQUIPMENT_FOLDERS)}
        </ScrollArea>
      </SelectContent>
    </Select>
  );
}