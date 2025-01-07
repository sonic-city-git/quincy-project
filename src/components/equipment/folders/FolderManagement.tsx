import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Folder } from "@/types/folders";
import { FolderItem } from "./FolderItem";
import { CreateFolderForm } from "./CreateFolderForm";

interface FolderManagementProps {
  folders: Folder[];
  onClose: () => void;
}

interface FolderItemState {
  [key: string]: boolean;
}

export function FolderManagement({ folders: initialFolders, onClose }: FolderManagementProps) {
  const [newFolderName, setNewFolderName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<FolderItemState>({});
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const { toast } = useToast();

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

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const { error } = await supabase
        .from('folders')
        .insert([{ 
          name: newFolderName,
        }]);

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
      // First, delete all subfolders
      const { error: subfoldersError } = await supabase
        .from('folders')
        .delete()
        .eq('parent_id', id);

      if (subfoldersError) throw subfoldersError;

      // Then delete the folder itself
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Folder and its subfolders have been deleted successfully",
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

  const handleAddSubfolder = async (parentId: string) => {
    if (!newFolderName.trim()) return;

    try {
      const { error } = await supabase
        .from('folders')
        .insert([{ 
          name: newFolderName,
          parent_id: parentId 
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subfolder has been created successfully",
      });

      setNewFolderName("");
    } catch (error) {
      console.error('Error adding subfolder:', error);
      toast({
        title: "Error",
        description: "Failed to create subfolder",
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
    const children = folders.filter(f => f.parent_id === folder.id);
    
    return (
      <FolderItem
        key={folder.id}
        folder={folder}
        level={level}
        isExpanded={expandedFolders[folder.id]}
        onToggle={toggleFolder}
        onUpdate={handleUpdateFolder}
        onDelete={handleDeleteFolder}
        onAddSubfolder={handleAddSubfolder}
        showAddSubfolder={level === 0}
      >
        {children.length > 0 && children.map(child => renderFolderItem(child, level + 1))}
      </FolderItem>
    );
  };

  // Get only root folders (no parent)
  const rootFolders = folders.filter(f => !f.parent_id);

  return (
    <div className="space-y-4">
      <CreateFolderForm
        newFolderName={newFolderName}
        onNameChange={setNewFolderName}
        onSubmit={handleAddFolder}
      />
      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {rootFolders.map(folder => renderFolderItem(folder))}
        </div>
      </ScrollArea>
    </div>
  );
}