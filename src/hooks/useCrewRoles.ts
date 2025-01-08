import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CrewRole } from "@/types/crew";

export function useCrewRoles() {
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['crew-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_roles')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as CrewRole[];
    },
  });

  return {
    roles,
    isLoading,
  };
}