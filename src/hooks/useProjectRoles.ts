import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { HourlyCategory, ProjectRole } from "@/integrations/supabase/types/crew";

export function useProjectRoles(projectId: string) {
  const queryClient = useQueryClient();

  const { data: roles = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['project_roles', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_roles')
        .select(`
          *,
          role:crew_roles (
            id,
            name,
            color
          ),
          preferred:crew_members!project_roles_preferred_id_fkey (
            id,
            name
          )
        `)
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching project roles:', error);
        toast.error('Failed to fetch project roles');
        throw error;
      }
      return data;
    }
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

      await queryClient.invalidateQueries({ queryKey: ['project_roles', projectId] });
      toast.success('Role added successfully');
    } catch (error) {
      console.error('Error adding role:', error);
      toast.error('Failed to add role');
    }
  };

  const updateRole = async (roleId: string, roleData: any) => {
    try {
      const { error } = await supabase
        .from('project_roles')
        .update(roleData)
        .eq('id', roleId);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['project_roles', projectId] });
      toast.success('Role updated successfully');
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const deleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('project_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['project_roles', projectId] });
      toast.success('Role deleted successfully');
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Failed to delete role');
    }
  };

  return {
    roles,
    loading,
    deleteRole,
    updateRole,
    addRole,
    refetch
  };
}