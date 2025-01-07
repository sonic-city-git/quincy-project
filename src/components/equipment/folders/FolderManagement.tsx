import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown } from "lucide-react";
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

interface FolderItemState {
  [key: string]: boolean;
}

export function FolderManagement({ folders, onClose }: FolderManagementProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<FolderItemState>({});
  const { toast } = useToast();

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('folders')
        .insert([{ name: newFolderName }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Folder has been created successfully",
      });

      setNewFolderName("");
    } catch (error) {
      console.error('Error adding folder:', error);
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      });
    }
  };

  const handleUpdateFolder = async (id: string, name: string) => {
    if (!name.trim()) return;

    try {
      const { error } = await supabase
        .from('folders')
        .update({ name })
        .eq('id', id);

      if (error) throw error;

      setEditingId(null);
      toast({
        title: "Success",
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
        title: "Success",
        description: "Folder has been deleted successfully",
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

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const renderFolderItem = (folder: Folder, level: number = 0) => {
    const isEditing = editingId === folder.id;
    const children = folders.filter(f => f.parent_id === folder.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedFolders[folder.id];

    return (
      <div key={folder.id} className="space-y-2">
        <div className="flex items-center gap-2" style={{ marginLeft: `${level * 20}px` }}>
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-4 w-4 hover:bg-transparent"
              onClick={() => toggleFolder(folder.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          {!hasChildren && <div className="w-4" />}
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
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {children.map(child => renderFolderItem(child, level + 1))}
          </div>
        )}
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
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAddFolder();
            }
          }}
        />
        <Button 
          size="sm" 
          onClick={handleAddFolder} 
          disabled={!newFolderName.trim()}
        >
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