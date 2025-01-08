import { useState, useEffect, useCallback } from "react";
import { Equipment } from "@/types/equipment";
import { Folder } from "@/types/folders";
import { supabase } from "@/integrations/supabase/client";

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
          table: 'folders'
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
      .from('folders')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching folders:', error);
      return;
    }

    setFolders(data || []);
  };

  const getFolderName = useCallback((folderId: string | undefined): string => {
    if (!folderId) return 'Uncategorized';

    const folder = folders.find(f => f.id === folderId);
    if (!folder) return 'Uncategorized';

    if (folder.parent_id) {
      const parent = folders.find(f => f.id === folder.parent_id);
      return parent ? `${parent.name} / ${folder.name}` : folder.name;
    }

    return folder.name;
  }, [folders]);

  const getFolderSortOrder = useCallback((folderId: string | undefined): string => {
    if (!folderId) return 'zzz_uncategorized';

    const folder = folders.find(f => f.id === folderId);
    if (!folder) return 'zzz_uncategorized';

    if (folder.parent_id) {
      const parent = folders.find(f => f.id === folder.parent_id);
      return parent ? `${parent.name}_${folder.name}` : folder.name;
    }

    return folder.name;
  }, [folders]);

  const groupEquipmentByFolder = useCallback((equipment: Equipment[]) => {
    return equipment.reduce((acc, item) => {
      const folderName = getFolderName(item.folder_id);
      if (!acc[folderName]) {
        acc[folderName] = [];
      }
      acc[folderName].push(item);
      return acc;
    }, {} as Record<string, Equipment[]>);
  }, [getFolderName]);

  return {
    folders,
    getFolderName,
    getFolderSortOrder,
    groupEquipmentByFolder,
  };
}