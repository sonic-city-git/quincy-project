import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CrewMember } from "@/types/crew";
import { toast } from "sonner";
import { useEffect } from "react";

export function useCrew() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crew_folders'
        },
        () => {
          // Invalidate and refetch crew data when folders change
          queryClient.invalidateQueries({ queryKey: ['crew'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: crew = [], isLoading: loading } = useQuery({
    queryKey: ['crew'],
    queryFn: async () => {
      try {
        console.log('Fetching crew members...');
        const { data, error } = await supabase
          .from('crew_members')
          .select(`
            id,
            name,
            email,
            phone,
            created_at,
            updated_at,
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

        // Map the response to match the CrewMember type
        return data.map((member): CrewMember => {
          // Safely handle folder data
          const folder = member.folder && typeof member.folder === 'object' && 'id' in member.folder && 'name' in member.folder
            ? { id: member.folder.id, name: member.folder.name }
            : null;

          // Safely handle role data
          const role = member.role?.[0]?.crew_roles && 
            typeof member.role[0].crew_roles === 'object' && 
            'id' in member.role[0].crew_roles && 
            'name' in member.role[0].crew_roles &&
            'color' in member.role[0].crew_roles
            ? member.role[0].crew_roles
            : null;

          return {
            id: member.id,
            name: member.name,
            email: member.email || null,
            phone: member.phone || null,
            folder,
            role,
            created_at: member.created_at,
            updated_at: member.updated_at
          };
        });
      } catch (error) {
        console.error('Error in crew query:', error);
        toast.error("Failed to fetch crew members");
        throw error;
      }
    },
    retry: 1
  });

  return { crew, loading };
}