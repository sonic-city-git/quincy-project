import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFolders() {
  const { data: folders = [], isLoading: loading } = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_folders')
        .select('id, name, created_at, updated_at')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  return { folders, loading };
}