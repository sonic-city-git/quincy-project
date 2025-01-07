import { useState } from "react";
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

export function FolderManagement({ folders, onClose }: FolderManagementProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<FolderItemState>({});
  const { toast } = useToast();

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('folders')
        .insert([{ 
          name: newFolderName,
          parent_id: selectedParentId 
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Folder has been created successfully",
      });

      setNewFolderName("");
      setSelectedParentId(null);
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

  const handleAddSubfolder = (parentId: string) => {
    setSelectedParentId(parentId);
    setNewFolderName("");
  };

  const renderFolderItem = (folder: Folder, level: number = 0) => {
    // Only show "Add Subfolder" button for top-level folders (level 0)
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
        showAddSubfolder={level === 0} // Only show add subfolder button for top-level folders
      >
        {children.length > 0 && children.map(child => renderFolderItem(child, level + 1))}
      </FolderItem>
    );
  };

  // Get only root folders (no parent)
  const rootFolders = folders.filter(f => !f.parent_id);

  // Filter out folders that would be available as parents
  // Only root folders can be parents
  const availableParentFolders = folders.filter(f => !f.parent_id);

  return (
    <div className="space-y-4">
      <CreateFolderForm
        folders={availableParentFolders} // Only pass root folders as available parents
        newFolderName={newFolderName}
        selectedParentId={selectedParentId}
        onNameChange={setNewFolderName}
        onParentChange={setSelectedParentId}
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