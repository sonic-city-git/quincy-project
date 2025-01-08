import { useState, useCallback, useEffect } from "react";
import { Equipment } from "@/types/equipment";

export function useEquipmentFilter() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  const filterFunction = useCallback((items: Equipment[]) => {
    if (!items || !Array.isArray(items)) {
      return [];
    }

    return items.filter((item) => {
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

  useEffect(() => {
    const filtered = filterFunction(equipment);
    setFilteredEquipment(filtered);
  }, [equipment, filterFunction]);

  const filterEquipment = useCallback((newEquipment: Equipment[]) => {
    setEquipment(newEquipment);
    return filterFunction(newEquipment);
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