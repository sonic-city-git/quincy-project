import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CrewRole {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export function useCrewRoles() {
  const { data: roles = [], isLoading, error } = useQuery({
    queryKey: ['crew-roles'],
    queryFn: async () => {
      console.log('Starting to fetch crew roles...');
      
      const { data, error, count } = await supabase
        .from('crew_roles')
        .select('*', { count: 'exact' });
      
      if (error) {
        console.error('Error fetching crew roles:', error);
        toast.error('Failed to fetch crew roles');
        throw error;
      }

      console.log('Query response:', { data, error, count });

      if (!data) {
        console.log('No data returned from query');
        return [];
      }

      if (data.length === 0) {
        console.log('No roles found in the database');
        return [];
      }

      console.log('Successfully fetched crew roles:', data);
      return data as CrewRole[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1,
  });

  if (error) {
    console.error('Query error:', error);
  }

  return { roles, isLoading };
}