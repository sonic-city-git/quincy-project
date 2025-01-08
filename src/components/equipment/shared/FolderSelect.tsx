import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Folder } from "@/types/folders";

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
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

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
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching folders:', error);
        return;
      }

      setFolders(data || []);
    } finally {
      setLoading(false);
    }
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
    <Select
      value={selectedFolder || "all"}
      onValueChange={(value) => onFolderSelect(value === "all" ? null : value)}
      required={required}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={loading ? "Loading folders..." : "Select folder"}>
          {getFolderPath(selectedFolder)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {showAllFolders && <SelectItem value="all">All folders</SelectItem>}
        {renderFolderOptions()}
      </SelectContent>
    </Select>
  );
}