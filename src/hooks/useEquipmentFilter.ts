import { useState, useCallback } from "react";
import { Equipment } from "@/types/equipment";
import { isItemInFolder } from "@/utils/folderUtils";

export function useEquipmentFilter() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filterEquipment = useCallback(async (equipment: Equipment[]) => {
    const filteredEquipment = [];
    
    for (const item of equipment) {
      const matchesSearch = searchTerm === "" || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFolder = !selectedFolder || 
        selectedFolder === "all" || 
        (selectedFolder === "none" && !item.folderId) ||
        await isItemInFolder(item.folderId, selectedFolder);

      if (matchesSearch && matchesFolder) {
        filteredEquipment.push(item);
      }
    }
    
    return filteredEquipment;
  }, [selectedFolder, searchTerm]);

  return {
    selectedFolder,
    setSelectedFolder,
    searchTerm,
    setSearchTerm,
    filterEquipment,
  };
}