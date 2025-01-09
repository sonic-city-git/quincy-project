import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CrewMember } from "@/types/crew";
import { toast } from "sonner";

export function useCrew() {
  const { data: crew = [], isLoading: loading } = useQuery({
    queryKey: ['crew'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('crew_members')
          .select(`
            id,
            name,
            email,
            phone,
            folder:crew_folders (
              id,
              name
            ),
            role:crew_member_roles!crew_member_id (
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
          toast.error("Failed to fetch crew members");
          throw error;
        }

        if (!data) {
          return [];
        }

        return data.map((member): CrewMember => ({
          id: member.id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          folder: member.folder,
          role: member.role?.[0]?.crew_roles || null,
          created_at: member.created_at,
          updated_at: member.updated_at
        }));
      } catch (error) {
        console.error('Error in crew query:', error);
        toast.error("Failed to fetch crew members");
        throw error;
      }
    },
    retry: false
  });

  return { crew, loading };
}