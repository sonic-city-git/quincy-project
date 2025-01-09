import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CrewMember } from "@/types/crew";

export function useCrew() {
  const { data: crew = [], isLoading: loading } = useQuery({
    queryKey: ['crew'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_members')
        .select(`
          *,
          role:role_id (
            id,
            name,
            color
          )
        `);

      if (error) throw error;
      return data as CrewMember[];
    },
  });

  return {
    crew,
    loading,
  };
}