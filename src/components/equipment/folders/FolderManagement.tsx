import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Folder } from "@/types/folders";

interface FolderManagementProps {
  folders: Folder[];
  onClose: () => void;
}

export function FolderManagement({ folders, onClose }: FolderManagementProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAddFolder = async () => {
    try {
      const { error } = await supabase
        .from('folders')
        .insert([{ name: newFolderName, parent_id: parentId }]);

      if (error) throw error;

      setNewFolderName("");
      toast({
        title: "Folder added",
        description: "New folder has been created successfully",
      });
    } catch (error) {
      console.error('Error adding folder:', error);
      toast({
        title: "Error",
        description: "Failed to add folder",
        variant: "destructive",
      });
    }
  };

  const handleUpdateFolder = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('folders')
        .update({ name })
        .eq('id', id);

      if (error) throw error;

      setEditingId(null);
      toast({
        title: "Folder updated",
        description: "Folder has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating folder:', error);
      toast({
        title: "Error",
        description: "Failed to update folder",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFolder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Folder deleted",
        description: "Folder has been removed successfully",
      });
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive",
      });
    }
  };

  const renderFolderItem = (folder: Folder, level: number = 0) => {
    const isEditing = editingId === folder.id;
    const children = folders.filter(f => f.parent_id === folder.id);

    return (
      <div key={folder.id} className="space-y-2">
        <div className="flex items-center gap-2" style={{ marginLeft: `${level * 20}px` }}>
          {children.length > 0 && <ChevronRight className="h-4 w-4" />}
          {isEditing ? (
            <Input
              value={folder.name}
              onChange={(e) => handleUpdateFolder(folder.id, e.target.value)}
              onBlur={() => setEditingId(null)}
              autoFocus
              className="h-8"
            />
          ) : (
            <>
              <span className="flex-1">{folder.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingId(folder.id)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteFolder(folder.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        {children.map(child => renderFolderItem(child, level + 1))}
      </div>
    );
  };

  const rootFolders = folders.filter(f => !f.parent_id);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="New folder name"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          className="h-8"
        />
        <Button size="sm" onClick={handleAddFolder} disabled={!newFolderName}>
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>
      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {rootFolders.map(folder => renderFolderItem(folder))}
        </div>
      </ScrollArea>
    </div>
  );
}