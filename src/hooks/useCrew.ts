import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CrewMember } from "@/types/crew";
import { toast } from "sonner";
import { useEffect } from "react";

interface CrewMemberResponse {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  folder: {
    id: string;
    name: string;
  }[] | null;
  role: {
    id: string;
    name: string;
    color: string;
  }[] | null;
}

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

        return (data as CrewMemberResponse[]).map((member): CrewMember => ({
          id: member.id,
          name: member.name,
          email: member.email || null,
          phone: member.phone || null,
          folder: member.folder?.[0] ? {
            id: member.folder[0].id,
            name: member.folder[0].name
          } : null,
          role: member.role?.[0] ? {
            id: member.role[0].id,
            name: member.role[0].name,
            color: member.role[0].color
          } : null,
          created_at: member.created_at,
          updated_at: member.updated_at
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