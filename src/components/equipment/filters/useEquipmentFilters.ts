import { useState } from "react";
import { Equipment } from "@/integrations/supabase/types/equipment";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useEquipmentFilters() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);

  // Fetch all folders to build parent-child relationships
  const { data: folders = [] } = useQuery({
    queryKey: ['equipment-folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_folders')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

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
    console.log('Filtering equipment with:', {
      searchQuery,
      selectedFolders,
      totalEquipment: equipment.length
    });

    // Get all folder IDs including children of selected folders
    const expandedFolderIds = selectedFolders.flatMap(folderId => getChildFolderIds(folderId));

    return equipment.filter(item => {
      const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFolders = selectedFolders.length === 0 || 
        (item.folder_id && expandedFolderIds.includes(item.folder_id));

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