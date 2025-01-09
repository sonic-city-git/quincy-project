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
          role:crew_member_roles (
            crew_roles (
              id,
              name,
              color
            )
          )
        `);

      if (error) throw error;
      
      // Transform the data to match CrewMember type
      return data.map(member => ({
        ...member,
        role: member.role?.[0]?.crew_roles || null
      })) as CrewMember[];
    },
  });

  return {
    crew,
    loading,
  };
}