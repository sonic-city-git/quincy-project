import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sortCrewFolders } from "@/utils/crewFolderSort";

export function useCrewFolders() {
  const { data = [], isLoading: loading } = useQuery({
    queryKey: ['crew-folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_folders')
        .select('*');
      if (error) throw error;
      
      // Apply custom sorting: Sonic City → Associates → Freelancers → others
      return sortCrewFolders(data || []);
    },
  });

  return { folders: data, loading };
}