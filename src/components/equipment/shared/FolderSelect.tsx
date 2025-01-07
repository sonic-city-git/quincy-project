import React from "react";
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
        <SelectContent className="max-h-[200px] overflow-y-auto">
          {EQUIPMENT_FOLDERS.map((folder) => (
            <React.Fragment key={folder.id}>
              <SelectItem 
                value={folder.id}
                className="font-bold pl-2"
              >
                {folder.name}
              </SelectItem>
              {folder.subfolders?.map((subfolder) => (
                <SelectItem 
                  key={subfolder.id} 
                  value={subfolder.id}
                  className="pl-8 italic font-normal"
                >
                  {subfolder.name}
                </SelectItem>
              ))}
            </React.Fragment>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}