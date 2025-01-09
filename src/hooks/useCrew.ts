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
          id,
          name,
          email,
          phone,
          folder:crew_folders!crew_members_folder_id_fkey (
            id,
            name
          ),
          role:crew_member_roles (
            crew_roles (
              id,
              name,
              color
            )
          )
        `)
        .order('name');

      if (error) {
        console.error('Error fetching crew:', error);
        throw error;
      }

      return data.map((member: any) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        folder: member.folder,
        role: member.role?.[0]?.crew_roles || null,
        created_at: member.created_at,
        updated_at: member.updated_at
      })) as CrewMember[];
    }
  });

  return { crew, loading };
}