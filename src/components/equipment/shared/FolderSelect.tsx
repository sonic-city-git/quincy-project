import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Folder } from "@/types/folders";
import { FolderManagement } from "../folders/FolderManagement";

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
  const [isManaging, setIsManaging] = useState(false);

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
      .order('created_at');

    if (error) {
      console.error('Error fetching folders:', error);
      return;
    }

    setFolders(data);
  };

  const getFolderPath = (folderId: string | null): string => {
    if (!folderId) return 'All folders';

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
        value={selectedFolder || undefined}
        onValueChange={(value) => onFolderSelect(value)}
        required={required}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select folder">
            {getFolderPath(selectedFolder)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-[400px]">
            {showAllFolders && <SelectItem value="all">All folders</SelectItem>}
            {renderFolderOptions()}
          </ScrollArea>
        </SelectContent>
      </Select>

      <Dialog open={isManaging} onOpenChange={setIsManaging}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manage Folders</DialogTitle>
          </DialogHeader>
          <FolderManagement
            folders={folders}
            onClose={() => setIsManaging(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}