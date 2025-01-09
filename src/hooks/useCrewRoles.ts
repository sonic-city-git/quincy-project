import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Role } from "@/types/crew";
import { sortRoles } from "@/utils/roleUtils";

export function useCrewRoles() {
  const { data: roles = [], isLoading, error } = useQuery({
    queryKey: ['crew-roles'],
    queryFn: async () => {
      console.log('Fetching crew roles...');
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching crew roles:', error);
        throw error;
      }
      
      console.log('Fetched crew roles:', data);
      return data as Role[];
    },
  });

  return {
    roles,
    isLoading,
    error
  };
}