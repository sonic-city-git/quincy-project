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
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['crew-roles'],
    queryFn: async () => {
      console.log('Fetching crew roles...');
      const { data, error } = await supabase
        .from('crew_roles')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching crew roles:', error);
        toast.error('Failed to fetch crew roles');
        throw error;
      }

      console.log('Fetched crew roles:', data);
      return data as CrewRole[];
    },
    retry: 1
  });

  return { roles, isLoading };
}