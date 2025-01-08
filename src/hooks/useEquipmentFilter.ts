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
        // First check if the item has a Folder field (from database) or folderId
        const itemFolderId = item.folderId || item.Folder;
        
        // Direct match
        if (itemFolderId === selectedFolder) return true;

        // Check parent-child relationship
        const selectedFolderParent = EQUIPMENT_FOLDERS.find(folder => 
          folder.subfolders?.some(sub => sub.id === selectedFolder)
        );

        // If selected folder is a subfolder, only show items in that specific subfolder
        if (selectedFolderParent) {
          return itemFolderId === selectedFolder;
        }

        // If selected folder is a parent folder, show all items in its subfolders
        const selectedParentFolder = EQUIPMENT_FOLDERS.find(f => f.id === selectedFolder);
        if (selectedParentFolder?.subfolders) {
          return selectedParentFolder.subfolders.some(sub => sub.id === itemFolderId);
        }

        return false;
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