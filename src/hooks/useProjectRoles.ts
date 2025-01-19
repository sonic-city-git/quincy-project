import { supabase } from "@/integrations/supabase/client";
import { HourlyCategory } from "@/types/events";
import { useQuery } from "@tanstack/react-query";

export const useProjectRoles = (projectId?: string) => {
  const { data: roles, isLoading } = useQuery({
    queryKey: ['project-roles', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_roles')
        .select(`
          *,
          role:crew_roles (
            id,
            name,
            color
          ),
          preferred:crew_members (
            id,
            name
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      return data;
    },
    enabled: !!projectId
  });

  const addRole = async (roleData: {
    role_id: string;
    daily_rate: number;
    hourly_rate: number;
    preferred_id: string;
    hourly_category: HourlyCategory;
    is_artist?: boolean;
    is_hours_event?: boolean;
  }) => {
    try {
      const { error } = await supabase
        .from('project_roles')
        .insert([{ 
          project_id: projectId,
          role_id: roleData.role_id,
          daily_rate: roleData.daily_rate,
          hourly_rate: roleData.hourly_rate,
          preferred_id: roleData.preferred_id,
          hourly_category: roleData.hourly_category
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error adding role:', error);
      throw error;
    }
  };

  return {
    roles,
    isLoading,
    addRole
  };
};