import { useState, useCallback } from "react";
import { Equipment } from "@/types/equipment";
import { isItemInFolder } from "@/utils/folderUtils";

export function useEquipmentFilter() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);

  const filterEquipment = useCallback((equipment: Equipment[]) => {
    if (!equipment || !Array.isArray(equipment)) {
      setFilteredEquipment([]);
      return [];
    }

    const filtered = equipment.filter((item) => {
      const matchesSearch = searchTerm === "" || 
        (item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.code?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFolder = !selectedFolder || 
        selectedFolder === "all" || 
        (selectedFolder === "none" && !item.folderId) ||
        item.Folder === selectedFolder;
      
      return matchesSearch && matchesFolder;
    });

    setFilteredEquipment(filtered);
    return filtered;
  }, [selectedFolder, searchTerm]);

  return {
    selectedFolder,
    setSelectedFolder,
    searchTerm,
    setSearchTerm,
    filterEquipment,
    filteredEquipment,
  };
}