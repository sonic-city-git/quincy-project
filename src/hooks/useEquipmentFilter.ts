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

    const filtered = items.filter((item) => {
      const matchesSearch = searchTerm === "" || 
        (item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.code?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFolder = !selectedFolder || 
        selectedFolder === "all" || 
        item.folderId === selectedFolder;
      
      return matchesSearch && matchesFolder;
    });

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