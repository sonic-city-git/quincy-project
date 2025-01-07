import { useState } from "react";
import { Equipment } from "@/types/equipment";
import { isItemInFolder } from "@/utils/folderUtils";

export function useEquipmentFilter() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filterEquipment = (equipment: Equipment[]) => {
    return equipment.filter(item => {
      const matchesSearch = searchTerm === "" || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFolder = !selectedFolder || 
        selectedFolder === "all" || 
        (selectedFolder === "none" && !item.folderId) ||
        isItemInFolder(item.folderId, selectedFolder);
      return matchesSearch && matchesFolder;
    });
  };

  return {
    selectedFolder,
    setSelectedFolder,
    searchTerm,
    setSearchTerm,
    filterEquipment,
  };
}