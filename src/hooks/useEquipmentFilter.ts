import { useState, useCallback, useEffect } from "react";
import { Equipment } from "@/types/equipment";
import { supabase } from "@/integrations/supabase/client";
import { Folder } from "@/types/folders";

export function useEquipmentFilter() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);

  const getFolderOrder = useCallback((folderId: string | undefined): string => {
    const folder = folders.find(f => f.id === folderId);
    return folder?.name || 'zzz'; // Items without a folder go last
  }, [folders]);

  const sortByFolderStructure = useCallback((items: Equipment[]): Equipment[] => {
    return [...items].sort((a, b) => {
      const folderA = getFolderOrder(a.folder_id);
      const folderB = getFolderOrder(b.folder_id);
      if (folderA !== folderB) return folderA.localeCompare(folderB);
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [getFolderOrder]);

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

    if (selectedFolder && selectedFolder !== "all") {
      filtered = filtered.filter(item => {
        const itemFolderId = item.folder_id || item.Folder;
        return itemFolderId === selectedFolder || isFolderChild(itemFolderId, selectedFolder);
      });
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        (item.name?.toLowerCase().includes(searchLower) || 
         item.code?.toLowerCase().includes(searchLower))
      );
    }

    return sortByFolderStructure(filtered);
  }, [selectedFolder, searchTerm, isFolderChild, sortByFolderStructure]);

  const filterEquipment = useCallback((newEquipment: Equipment[]) => {
    const filtered = filterFunction(newEquipment);
    setFilteredEquipment(filtered);
    return filtered;
  }, [filterFunction]);

  useEffect(() => {
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