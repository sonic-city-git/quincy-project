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
          folder:folder_id (
            id,
            name
          ),
          crew_member_roles!crew_member_roles_crew_member_id_fkey (
            role:crew_roles (
              id,
              name,
              color
            )
          )
        `);

      if (error) throw error;
      
      // Transform the data to match CrewMember type
      return data.map((member: any) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        folder: member.folder,
        role: member.crew_member_roles[0]?.role || null,
        created_at: member.created_at,
        updated_at: member.updated_at
      })) as CrewMember[];
    }
  });

  return { crew, loading };
}