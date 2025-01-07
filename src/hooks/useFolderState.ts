import { useState, useEffect } from "react";
import { Folder } from "@/types/folders";
import { supabase } from "@/integrations/supabase/client";

export function useFolderState(initialFolders: Folder[]) {
  const sortFolders = (foldersToSort: Folder[]): Folder[] => {
    return [...foldersToSort].sort((a, b) => a.name.localeCompare(b.name));
  };

  const [folders, setFolders] = useState<Folder[]>(sortFolders(initialFolders));
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

    setFolders(sortFolders(data));
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