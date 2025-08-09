import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFolders } from "@/hooks/ui";

interface EquipmentFolderFilterProps {
  selectedFolders: string[];
  onFolderToggle: (folderId: string) => void;
}

interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
}

import { FOLDER_ORDER, SUBFOLDER_ORDER } from "@/types/equipment";

export function EquipmentFolderFilter({
  selectedFolders,
  onFolderToggle,
}: EquipmentFolderFilterProps) {
  const { folders = [] } = useFolders();

  // Organize folders into a hierarchy and sort them according to the specified order
  const mainFolders = folders
    .filter(folder => !folder.parent_id)
    .sort((a, b) => {
      const indexA = FOLDER_ORDER.indexOf(a.name as any);
      const indexB = FOLDER_ORDER.indexOf(b.name as any);
      
      if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    });

  const getSubfolders = (parentId: string) => {
    const parentFolder = folders.find(f => f.id === parentId);
    if (!parentFolder) return [];

    const subfolders = folders.filter(folder => folder.parent_id === parentId);
    const orderArray = SUBFOLDER_ORDER[parentFolder.name] || [];

    return subfolders.sort((a, b) => {
      const indexA = orderArray.indexOf(a.name);
      const indexB = orderArray.indexOf(b.name);
      
      if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    });
  };

  const renderFolderItems = (folder: Folder) => {
    const subfolders = getSubfolders(folder.id);
    
    return (
      <div key={folder.id}>
        <DropdownMenuCheckboxItem
          checked={selectedFolders.includes(folder.id)}
          onCheckedChange={() => onFolderToggle(folder.id)}
          className="relative pl-2"
        >
          {folder.name}
        </DropdownMenuCheckboxItem>
        {subfolders.map(subfolder => (
          <DropdownMenuCheckboxItem
            key={subfolder.id}
            checked={selectedFolders.includes(subfolder.id)}
            onCheckedChange={() => onFolderToggle(subfolder.id)}
            className="relative pl-8 italic"
          >
            {subfolder.name}
          </DropdownMenuCheckboxItem>
        ))}
      </div>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="default" 
          className="gap-2 bg-muted/50 border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <Filter className="h-4 w-4" />
          Filter
          {selectedFolders.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {selectedFolders.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-[200px] max-h-[300px] overflow-y-auto"
      >
        {mainFolders.map(folder => renderFolderItems(folder))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}