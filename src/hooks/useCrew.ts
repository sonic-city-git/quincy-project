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
          // Safely handle folder data with type assertion after validation
          const folderData = member.folder;
          let folder = null;
          
          if (folderData && typeof folderData === 'object') {
            const hasValidId = 'id' in folderData && typeof folderData.id === 'string';
            const hasValidName = 'name' in folderData && typeof folderData.name === 'string';
            
            if (hasValidId && hasValidName) {
              folder = {
                id: folderData.id,
                name: folderData.name
              };
            }
          }

          // Safely handle role data with type assertion after validation
          const roleData = member.role?.[0]?.crew_roles;
          let role = null;

          if (roleData && typeof roleData === 'object') {
            const hasValidId = 'id' in roleData && typeof roleData.id === 'string';
            const hasValidName = 'name' in roleData && typeof roleData.name === 'string';
            const hasValidColor = 'color' in roleData && typeof roleData.color === 'string';

            if (hasValidId && hasValidName && hasValidColor) {
              role = {
                id: roleData.id,
                name: roleData.name,
                color: roleData.color
              };
            }
          }

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