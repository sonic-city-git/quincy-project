import { useState } from "react";
import { Equipment } from "@/integrations/supabase/types/equipment";

export function useEquipmentFilters() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);

  const handleFolderToggle = (folderId: string) => {
    setSelectedFolders(prev => {
      if (prev.includes(folderId)) {
        return prev.filter(id => id !== folderId);
      }
      return [...prev, folderId];
    });
  };

  const clearFilters = () => {
    setSelectedFolders([]);
    setSearchQuery('');
  };

  const filterEquipment = (equipment: Equipment[]) => {
    return equipment.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFolders = selectedFolders.length === 0 || 
        (item.folder_id && selectedFolders.includes(item.folder_id));

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