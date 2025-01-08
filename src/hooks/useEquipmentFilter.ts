import { useState, useCallback, useMemo } from "react";
import { Equipment } from "@/types/equipment";
import { EQUIPMENT_FOLDERS, flattenFolders } from "@/data/equipmentFolders";

export function useEquipmentFilter() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);

  const getFolderOrder = (folderId: string | undefined): string => {
    const allFolders = flattenFolders(EQUIPMENT_FOLDERS);
    const folder = allFolders.find(f => f.id === folderId);
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

  const filterFunction = useCallback((items: Equipment[]) => {
    if (!items || !Array.isArray(items)) {
      return [];
    }

    let filtered = items;

    // Apply folder filter if a folder is selected
    if (selectedFolder && selectedFolder !== "all") {
      filtered = filtered.filter(item => {
        // Check if the item's folder matches the selected folder
        // or if it's in a subfolder of the selected folder
        const allFolders = flattenFolders(EQUIPMENT_FOLDERS);
        const selectedFolderObj = allFolders.find(f => f.id === selectedFolder);
        const itemFolderObj = allFolders.find(f => f.id === item.folderId);
        
        if (!selectedFolderObj || !itemFolderObj) return false;

        // If the folders match directly
        if (item.folderId === selectedFolder) return true;

        // Check if the item's folder is a subfolder of the selected folder
        const parentFolder = EQUIPMENT_FOLDERS.find(f => 
          f.subfolders?.some(sub => sub.id === item.folderId)
        );
        return parentFolder?.id === selectedFolder;
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
  }, [selectedFolder, searchTerm]);

  const filterEquipment = useCallback((newEquipment: Equipment[]) => {
    const filtered = filterFunction(newEquipment);
    setFilteredEquipment(filtered);
    return filtered;
  }, [filterFunction]);

  return {
    selectedFolder,
    setSelectedFolder,
    searchTerm,
    setSearchTerm,
    filterEquipment,
    filteredEquipment,
  };
}