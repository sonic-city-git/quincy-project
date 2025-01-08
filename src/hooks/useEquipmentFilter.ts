import { useState, useCallback, useMemo, useEffect } from "react";
import { Equipment } from "@/types/equipment";

export function useEquipmentFilter() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);

  const filterFunction = useCallback((equipment: Equipment[]) => {
    if (!equipment || !Array.isArray(equipment)) {
      return [];
    }

    return equipment.filter((item) => {
      const matchesSearch = searchTerm === "" || 
        (item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.code?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFolder = !selectedFolder || 
        selectedFolder === "all" || 
        (selectedFolder === "none" && !item.folderId) ||
        item.Folder === selectedFolder ||
        item.folderId === selectedFolder;
      
      return matchesSearch && matchesFolder;
    });
  }, [selectedFolder, searchTerm]);

  const filterEquipment = useCallback((equipment: Equipment[]) => {
    const filtered = filterFunction(equipment);
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