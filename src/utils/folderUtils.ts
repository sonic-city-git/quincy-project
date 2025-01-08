import { supabase } from "@/integrations/supabase/client";

export const sortFoldersByName = (folders: any[]) => {
  return [...folders].sort((a, b) => a.name.localeCompare(b.name));
};

export const isItemInFolder = async (itemFolderId: string | undefined | null, selectedFolderId: string | null): Promise<boolean> => {
  if (!itemFolderId || !selectedFolderId) {
    return !selectedFolderId && !itemFolderId;
  }

  // If the folder IDs match directly
  if (itemFolderId === selectedFolderId) {
    return true;
  }

  // Check if the item's folder is a child of the selected folder
  const { data: folders } = await supabase
    .from('folders')
    .select('*');

  if (!folders) return false;

  const findParentFolders = (folderId: string, parentId: string): boolean => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return false;
    if (folder.parent_id === parentId) return true;
    if (folder.parent_id) return findParentFolders(folder.parent_id, parentId);
    return false;
  };

  return findParentFolders(itemFolderId, selectedFolderId);
};