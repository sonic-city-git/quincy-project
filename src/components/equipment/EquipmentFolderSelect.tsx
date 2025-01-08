import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Folder } from "@/types/folders";

interface EquipmentFolderSelectProps {
  selectedFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
}

export function EquipmentFolderSelect({
  selectedFolder,
  onFolderSelect,
}: EquipmentFolderSelectProps) {
  const [folders, setFolders] = useState<Folder[]>([]);

  useEffect(() => {
    fetchFolders();

    const channel = supabase
      .channel('folders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'folders'
        },
        () => {
          fetchFolders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFolders = async () => {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching folders:', error);
      return;
    }

    setFolders(data);
  };

  const getFolderPath = (folderId: string | null): string => {
    if (!folderId || folderId === "all") return 'All folders';

    const folder = folders.find(f => f.id === folderId);
    if (!folder) return 'All folders';

    if (folder.parent_id) {
      const parent = folders.find(f => f.id === folder.parent_id);
      return parent ? `${parent.name} -> ${folder.name}` : folder.name;
    }

    return folder.name;
  };

  const renderFolderOptions = (parentId: string | null = null, level = 0) => {
    return folders
      .filter(folder => folder.parent_id === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(folder => (
        <div key={folder.id}>
          <SelectItem
            value={folder.id}
            className={`${level > 0 ? "ml-4 italic" : "font-bold"}`}
          >
            {folder.name}
          </SelectItem>
          {renderFolderOptions(folder.id, level + 1)}
        </div>
      ));
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedFolder || "all"}
        onValueChange={(value) => onFolderSelect(value === "all" ? null : value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select folder">
            {getFolderPath(selectedFolder)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-[400px]">
            <SelectItem value="all">All folders</SelectItem>
            {renderFolderOptions()}
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
}