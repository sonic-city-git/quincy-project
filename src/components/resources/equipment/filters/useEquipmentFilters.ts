import { useState } from "react";
import { Equipment } from "@/integrations/supabase/types/equipment";
import { useFolders } from "@/hooks/useFolders";

export function useEquipmentFilters() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const { folders = [] } = useFolders();

  const getChildFolderIds = (folderId: string): string[] => {
    const childFolders = folders.filter(folder => folder.parent_id === folderId);
    const childIds = childFolders.map(folder => folder.id);
    // Include child folders of children (recursive)
    const grandchildIds = childFolders.flatMap(child => getChildFolderIds(child.id));
    return [folderId, ...childIds, ...grandchildIds];
  };

  const handleFolderToggle = (folderId: string) => {
    console.log('Toggling folder:', folderId);
    setSelectedFolders(prev => {
      if (prev.includes(folderId)) {
        return prev.filter(id => id !== folderId);
      }
      return [...prev, folderId];
    });
  };

  const clearFilters = () => {
    console.log('Clearing all filters');
    setSelectedFolders([]);
    setSearchQuery('');
  };

  const filterEquipment = (equipment: Equipment[]) => {


    // Get all folder IDs including children of selected folders
    const expandedFolderIds = selectedFolders.flatMap(folderId => getChildFolderIds(folderId));

    return equipment.filter(item => {
      const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFolders = selectedFolders.length === 0 || 
        (item.folder_id && expandedFolderIds.includes(item.folder_id));



      return matchesSearch && matchesFolders;
    });
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedFolders,
    handleFolderToggle,
    clearFilters,
    filterEquipment
  };
}