import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectType {
  id: string;
  name: string;
  code: string;
  price_multiplier?: number;
}

export function useProjectTypes() {
  return useQuery({
    queryKey: ['project-types'],
    queryFn: async (): Promise<ProjectType[]> => {
      const { data, error } = await supabase
        .from('project_types')
        .select('id, name, code, price_multiplier')
        .order('name');
      
      if (error) {
        console.error('Error fetching project types:', error);
        throw error;
      }
      
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - project types don't change often
    gcTime: 30 * 60 * 1000,
  });
}
