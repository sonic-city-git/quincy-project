import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EquipmentFolder } from "@/types/equipment";
import { getFolderPath } from "@/utils/folderUtils";
import { EQUIPMENT_FOLDERS } from "@/data/equipmentFolders";

interface EquipmentFolderSelectProps {
  selectedFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
}

export function EquipmentFolderSelect({ selectedFolder, onFolderSelect }: EquipmentFolderSelectProps) {
  const renderFolderStructure = (folders: typeof EQUIPMENT_FOLDERS, level = 0) => {
    return folders.map(folder => (
      <div key={folder.id}>
        <DropdownMenuItem
          className={`cursor-pointer ${level > 0 ? 'italic pl-4' : 'font-bold'}`}
          onSelect={() => onFolderSelect(folder.id)}
        >
          {folder.name}
        </DropdownMenuItem>
        {folder.subfolders && renderFolderStructure(folder.subfolders, level + 1)}
      </div>
    ));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {getFolderPath(selectedFolder, EQUIPMENT_FOLDERS)}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <ScrollArea className="h-[400px]" type="hover">
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => onFolderSelect(null)}
          >
            All folders
          </DropdownMenuItem>
          {renderFolderStructure(EQUIPMENT_FOLDERS)}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}