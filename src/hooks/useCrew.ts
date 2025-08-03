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

        // Fetch all crew member roles and crew roles in separate queries
        const [crewMemberRolesResult, crewRolesResult] = await Promise.all([
          supabase.from('crew_member_roles').select('*'),
          supabase.from('crew_roles').select('*')
        ]);

        if (crewMemberRolesResult.error) {
          console.error('Error fetching crew member roles:', crewMemberRolesResult.error);
        }
        if (crewRolesResult.error) {
          console.error('Error fetching crew roles:', crewRolesResult.error);
        }

        // Create lookup maps
        const roleIdToName = new Map(
          (crewRolesResult.data || []).map(role => [role.id, role.name])
        );
        
        const memberIdToRoles = new Map<string, string[]>();
        (crewMemberRolesResult.data || []).forEach(cmr => {
          if (cmr.crew_member_id && cmr.role_id) {
            const roleName = roleIdToName.get(cmr.role_id);
            if (roleName) {
              if (!memberIdToRoles.has(cmr.crew_member_id)) {
                memberIdToRoles.set(cmr.crew_member_id, []);
              }
              memberIdToRoles.get(cmr.crew_member_id)!.push(roleName);
            }
          }
        });

        // Map crew data with roles
        const crewWithRoles = crewData.map(member => ({
          id: member.id,
          name: member.name,
          email: member.email || null,
          phone: member.phone || null,
          created_at: member.created_at,
          updated_at: member.updated_at,
          folder_id: member.folder_id,
          folderName: member.crew_folders?.name || null,
          avatar_url: member.avatar_url || null,
          roles: memberIdToRoles.get(member.id) || []
        }));

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