import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFolders } from "@/hooks/useFolders";

interface EquipmentFolderFilterProps {
  selectedFolders: string[];
  onFolderToggle: (folderId: string) => void;
}

interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
}

const FOLDER_ORDER = [
  "Mixers",
  "Microphones",
  "DI-boxes",
  "Cables/Split",
  "WL",
  "Outboard",
  "Stands/Clamps",
  "Misc",
  "Flightcases",
  "Consumables",
  "Kits",
  "Mindnes"
];

const SUBFOLDER_ORDER: Record<string, string[]> = {
  "Mixers": ["Mixrack", "Surface", "Expansion", "Small format"],
  "Microphones": ["Dynamic", "Condenser", "Ribbon", "Shotgun", "WL capsule", "Special/Misc"],
  "DI-boxes": ["Active", "Passive", "Special"],
  "Cables/Split": ["CAT", "XLR", "LK37/SB", "Jack", "Coax", "Fibre", "Schuko"],
  "WL": ["MIC", "IEM", "Antenna"]
};

export function EquipmentFolderFilter({
  selectedFolders,
  onFolderToggle,
}: EquipmentFolderFilterProps) {
  const { folders = [] } = useFolders();

  // Organize folders into a hierarchy and sort them according to the specified order
  const mainFolders = folders
    .filter(folder => !folder.parent_id)
    .sort((a, b) => {
      const indexA = FOLDER_ORDER.indexOf(a.name);
      const indexB = FOLDER_ORDER.indexOf(b.name);
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
          className="gap-2 bg-zinc-800/50 border-zinc-700 text-muted-foreground hover:text-foreground transition-colors"
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