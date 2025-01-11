import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFolders() {
  const { data = [], isLoading: loading } = useQuery({
    queryKey: ['equipment-folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_folders')
        .select('*');
      if (error) throw error;
      return data || [];
    },
  });

  return { folders: data, loading };
}