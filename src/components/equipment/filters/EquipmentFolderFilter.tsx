import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
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

  const renderFolder = (folder: Folder, level: number = 0) => {
    const subfolders = getSubfolders(folder.id);
    const isSelected = selectedFolders.includes(folder.id);

    return (
      <div key={folder.id} className="space-y-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFolderToggle(folder.id)}
          className={cn(
            "w-full justify-start gap-2",
            level > 0 && "pl-8",
            isSelected && "bg-accent"
          )}
        >
          <div className="h-4 w-4 shrink-0">
            {isSelected && <Check className="h-4 w-4" />}
          </div>
          {folder.name}
        </Button>
        {subfolders.length > 0 && (
          <div className="pl-2">
            {subfolders.map(subfolder => renderFolder(subfolder, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <ScrollArea className="h-[300px] rounded-md border">
      <div className="p-2">
        {mainFolders.map(folder => renderFolder(folder))}
      </div>
    </ScrollArea>
  );
}