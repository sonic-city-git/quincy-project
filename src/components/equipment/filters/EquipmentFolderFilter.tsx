import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EquipmentFolderFilterProps {
  selectedFolders: string[];
  onFolderToggle: (folderId: string) => void;
}

interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
}

export function EquipmentFolderFilter({
  selectedFolders,
  onFolderToggle,
}: EquipmentFolderFilterProps) {
  const { data: folders = [] } = useQuery({
    queryKey: ['equipment-folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_folders')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Folder[];
    },
  });

  // Organize folders into a hierarchy
  const mainFolders = folders.filter(folder => !folder.parent_id);
  const getSubfolders = (parentId: string) => 
    folders.filter(folder => folder.parent_id === parentId);

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
            className="relative pl-2"
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
          size="sm" 
          className="gap-2 text-muted-foreground hover:text-foreground transition-colors"
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
      <DropdownMenuContent align="start" className="w-56">
        {mainFolders.map(folder => renderFolderItems(folder))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}