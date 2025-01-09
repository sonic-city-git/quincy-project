import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useProjectRoles(projectId: string, selectedItems: string[] = []) {
  const queryClient = useQueryClient();

  const { data: projectRoles, isLoading: loading } = useQuery({
    queryKey: ['project_roles', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_roles')
        .select(`
          *,
          crew_roles:role_id (
            id,
            name,
            color
          ),
          preferred:preferred_id (
            id,
            name,
            email
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const deleteRole = async (roleId: string) => {
    try {
      await supabase
        .from('project_roles')
        .delete()
        .eq('id', roleId);
      toast.success("Role deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['project_roles', projectId] });
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error("Failed to delete role");
    }
  };

  const updateRole = async (roleId: string, updates: any) => {
    try {
      await supabase
        .from('project_roles')
        .update(updates)
        .eq('id', roleId);
      toast.success("Role updated successfully");
      queryClient.invalidateQueries({ queryKey: ['project_roles', projectId] });
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error("Failed to update role");
    }
  };

  const addRole = async (newRole: any) => {
    try {
      await supabase
        .from('project_roles')
        .insert(newRole);
      toast.success("Role added successfully");
      queryClient.invalidateQueries({ queryKey: ['project_roles', projectId] });
    } catch (error) {
      console.error('Error adding role:', error);
      toast.error("Failed to add role");
    }
  };

  const selectedRole = selectedItems.length === 1 && projectRoles?.find(role => role.id === selectedItems[0])
    ? {
        name: projectRoles.find(role => role.id === selectedItems[0])?.crew_roles?.name || '',
        dailyRate: projectRoles.find(role => role.id === selectedItems[0])?.daily_rate,
        hourlyRate: projectRoles.find(role => role.id === selectedItems[0])?.hourly_rate,
      }
    : null;

  return {
    projectRoles,
    loading,
    selectedRole,
    deleteRole,
    updateRole,
    addRole,
  };
}