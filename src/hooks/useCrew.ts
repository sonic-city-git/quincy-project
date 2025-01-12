import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CrewMember } from "@/types/crew";
import { toast } from "sonner";
import { useEffect } from "react";

export function useCrew(folderId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crew_members'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['crew', folderId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, folderId]);

  const { data: crew = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['crew', folderId],
    queryFn: async () => {
      try {
        // Build the base query
        let query = supabase
          .from('crew_members')
          .select(`
            *,
            crew_folders (
              name
            )
          `);

        // Add folder filter if provided
        if (folderId) {
          query = query.eq('folder_id', folderId);
        }

        // Execute query and order by name
        const { data: crewData, error: crewError } = await query.order('name');

        if (crewError) {
          console.error('Error fetching crew:', crewError);
          toast.error("Failed to fetch crew members");
          throw crewError;
        }

        if (!crewData) {
          return [];
        }

        // Then fetch roles for each crew member
        const crewWithRoles = await Promise.all(
          crewData.map(async (member) => {
            const { data: roleData, error: roleError } = await supabase
              .from('crew_member_roles')
              .select('role_id')
              .eq('crew_member_id', member.id);

            if (roleError) {
              console.error('Error fetching roles for member:', roleError);
              return {
                ...member,
                roles: []
              };
            }

            return {
              id: member.id,
              name: member.name,
              email: member.email || null,
              phone: member.phone || null,
              created_at: member.created_at,
              updated_at: member.updated_at,
              folder_id: member.folder_id,
              folderName: member.crew_folders?.name || null,
              roles: roleData?.map(role => role.role_id) || []
            };
          })
        );

        return crewWithRoles;
      } catch (error) {
        console.error('Error in crew query:', error);
        toast.error("Failed to fetch crew members");
        throw error;
      }
    },
    refetchOnMount: true,
    retry: 1
  });

  return { crew, loading, refetch };
}