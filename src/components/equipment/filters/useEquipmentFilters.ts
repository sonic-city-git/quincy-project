import { useState } from "react";
import { Equipment } from "@/integrations/supabase/types/equipment";

export function useEquipmentFilters() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);

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
    console.log('Filtering equipment with:', {
      searchQuery,
      selectedFolders,
      totalEquipment: equipment.length
    });

    return equipment.filter(item => {
      const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFolders = selectedFolders.length === 0 || 
        (item.folder_id && selectedFolders.includes(item.folder_id));

      console.log('Item filtering result:', {
        name: item.name,
        code: item.code,
        folder_id: item.folder_id,
        matchesSearch,
        matchesFolders
      });

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