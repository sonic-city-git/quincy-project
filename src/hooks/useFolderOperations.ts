import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useFolderOperations() {
  const { toast } = useToast();
  const [newFolderName, setNewFolderName] = useState("");

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
    if (!newFolderName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a folder name",
        variant: "destructive",
      });
      return;
    }

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

  return {
    newFolderName,
    setNewFolderName,
    handleAddFolder,
    handleUpdateFolder,
    handleDeleteFolder,
    handleAddSubfolder,
  };
}