import { useState, useCallback } from "react";
import { Equipment } from "@/types/equipment";
import { isItemInFolder } from "@/utils/folderUtils";

export function useEquipmentFilter() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);

  const filterEquipment = useCallback(async (equipment: Equipment[]) => {
    const filtered = await Promise.all(
      equipment.map(async (item) => {
        const matchesSearch = searchTerm === "" || 
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.code.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFolder = !selectedFolder || 
          selectedFolder === "all" || 
          (selectedFolder === "none" && !item.folderId) ||
          await isItemInFolder(item.folderId, selectedFolder);

        return matchesSearch && matchesFolder ? item : null;
      })
    );

    const result = filtered.filter((item): item is Equipment => item !== null);
    setFilteredEquipment(result);
    return result;
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