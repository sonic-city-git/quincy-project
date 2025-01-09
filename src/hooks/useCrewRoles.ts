import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CrewRole } from "@/types/crew";
import { sortRoles } from "@/utils/roleUtils";

export function useCrewRoles() {
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['crew-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_roles')
        .select('*')
        .order('name');
      
      if (error) throw error;
      console.log('Fetched crew roles:', data); // Add logging to debug
      const sortedRoles = sortRoles(data as CrewRole[]);
      return sortedRoles;
    },
    // Reduce stale time to ensure more frequent updates
    staleTime: 1000, // 1 second
    refetchOnWindowFocus: true,
  });

  return {
    roles,
    isLoading,
  };
}