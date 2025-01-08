import { useState, useCallback, useMemo } from "react";
import { Equipment } from "@/types/equipment";
import { supabase } from "@/integrations/supabase/client";
import { Folder } from "@/types/folders";

export function useEquipmentFilter() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);

  const getFolderOrder = (folderId: string | undefined): string => {
    const folder = folders.find(f => f.id === folderId);
    return folder?.name || 'zzz'; // Items without a folder go last
  };

  const sortByFolderStructure = (items: Equipment[]): Equipment[] => {
    return [...items].sort((a, b) => {
      const folderA = getFolderOrder(a.folderId);
      const folderB = getFolderOrder(b.folderId);
      if (folderA !== folderB) return folderA.localeCompare(folderB);
      return (a.name || '').localeCompare(b.name || '');
    });
  };

  const fetchFolders = useCallback(async () => {
    const { data, error } = await supabase
      .from('folders')
      .select('*');

    if (error) {
      console.error('Error fetching folders:', error);
      return;
    }

    setFolders(data);
  }, []);

  // Helper function to check if a folder is a child of another folder
  const isFolderChild = useCallback((childId: string | null, parentId: string | null): boolean => {
    if (!childId || !parentId) return false;
    
    const folder = folders.find(f => f.id === childId);
    if (!folder) return false;
    
    if (folder.parent_id === parentId) return true;
    
    return folder.parent_id ? isFolderChild(folder.parent_id, parentId) : false;
  }, [folders]);

  const filterFunction = useCallback((items: Equipment[]) => {
    if (!items || !Array.isArray(items)) {
      return [];
    }

    let filtered = items;

    // Apply folder filter if a folder is selected
    if (selectedFolder && selectedFolder !== "all") {
      filtered = filtered.filter(item => {
        // Check both folder_id and Folder fields from the equipment item
        const itemFolderId = item.folder_id || item.Folder;
        
        // Direct match with the selected folder
        if (itemFolderId === selectedFolder) return true;
        
        // Check if the item's folder is a child of the selected folder
        return isFolderChild(itemFolderId, selectedFolder);
      });
    }

    // Apply search filter if there's a search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        (item.name?.toLowerCase().includes(searchLower) || 
         item.code?.toLowerCase().includes(searchLower))
      );
    }

    // Sort the filtered results by folder structure
    return sortByFolderStructure(filtered);
  }, [selectedFolder, searchTerm, isFolderChild]);

  const filterEquipment = useCallback((newEquipment: Equipment[]) => {
    const filtered = filterFunction(newEquipment);
    setFilteredEquipment(filtered);
    return filtered;
  }, [filterFunction]);

  // Fetch folders when the hook is initialized
  useMemo(() => {
    fetchFolders();
  }, [fetchFolders]);

  return {
    selectedFolder,
    setSelectedFolder,
    searchTerm,
    setSearchTerm,
    filterEquipment,
    filteredEquipment,
  };
}