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
            folder:crew_folders(id, name),
            role:crew_roles(id, name, color)
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

        return data.map((member): CrewMember => {
          let folder = null;
          if (member.folder && Array.isArray(member.folder) && member.folder[0]) {
            const folderData = member.folder[0];
            if (folderData.id && folderData.name) {
              folder = {
                id: folderData.id,
                name: folderData.name
              };
            }
          }

          let role = null;
          if (member.role && Array.isArray(member.role) && member.role[0]) {
            const roleData = member.role[0];
            if (roleData.id && roleData.name && roleData.color) {
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