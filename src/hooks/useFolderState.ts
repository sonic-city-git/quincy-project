import { useState, useEffect } from "react";
import { Folder } from "@/types/folders";
import { supabase } from "@/integrations/supabase/client";
import { sortFoldersByName } from "@/utils/folderUtils";

export function useFolderState(initialFolders: Folder[]) {
  const [folders, setFolders] = useState<Folder[]>(sortFoldersByName(initialFolders));
  const [expandedFolders, setExpandedFolders] = useState<{ [key: string]: boolean }>({});

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

    setFolders(sortFoldersByName(data));
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  return {
    folders,
    expandedFolders,
    toggleFolder,
  };
}