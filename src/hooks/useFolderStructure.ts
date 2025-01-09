import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types/equipment";
import { Folder } from "@/types/folders";

export function useFolderStructure() {
  const [folders, setFolders] = useState<Folder[]>([]);

  useEffect(() => {
    fetchFolders();

    const channel = supabase
      .channel('folders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipment_folders'
        },
        () => {
          fetchFolders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFolders = async () => {
    const { data, error } = await supabase
      .from('equipment_folders')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching folders:', error);
      return;
    }

    setFolders(data || []);
  };

  const getFolderName = useCallback((folderId: string | null | undefined): string => {
    if (!folderId) return 'Unorganized';
    const folder = folders.find(f => f.id === folderId);
    return folder?.name || 'Unorganized';
  }, [folders]);

  const getFolderSortOrder = useCallback((folderId: string | null | undefined): string => {
    const name = getFolderName(folderId);
    return name === 'Unorganized' ? 'zzz' : name;
  }, [getFolderName]);

  const groupEquipmentByFolder = useCallback((equipment: Equipment[]): Record<string, Equipment[]> => {
    return equipment.reduce((acc: Record<string, Equipment[]>, item) => {
      const folderName = getFolderName(item.folder_id);
      if (!acc[folderName]) {
        acc[folderName] = [];
      }
      acc[folderName].push(item);
      return acc;
    }, {});
  }, [getFolderName]);

  return {
    folders,
    getFolderName,
    getFolderSortOrder,
    groupEquipmentByFolder,
  };
}