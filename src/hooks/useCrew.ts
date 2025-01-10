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
          table: 'crew_members'
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
            *,
            crew_folders (
              name
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
          email: member.email || null,
          phone: member.phone || null,
          created_at: member.created_at,
          updated_at: member.updated_at,
          folder_id: member.folder_id,
          folderName: member.crew_folders?.name || null
        }));
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