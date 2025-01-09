import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CrewFolder } from "@/types/crew";

export function useFolderStructure() {
  const [folders, setFolders] = useState<CrewFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const { data, error } = await supabase
          .from('equipment_folders')
          .select('*')
          .order('name');

        if (error) throw error;
        setFolders(data as CrewFolder[]);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFolders();
  }, []);

  return { folders, isLoading, error };
}