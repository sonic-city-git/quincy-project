import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useProjectRoles(projectId: string) {
  const queryClient = useQueryClient();

  const { data: roles = [], isLoading: loading } = useQuery({
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
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      return data;
    },
  });

  const deleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('project_roles')
        .delete()
        .eq('id', roleId);
      
      if (error) throw error;
      
      toast.success("Role deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['project_roles', projectId] });
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error("Failed to delete role");
    }
  };

  const updateRole = async (roleId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('project_roles')
        .update(updates)
        .eq('id', roleId);
      
      if (error) throw error;
      
      toast.success("Role updated successfully");
      queryClient.invalidateQueries({ queryKey: ['project_roles', projectId] });
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error("Failed to update role");
    }
  };

  const addRole = async (newRole: any) => {
    try {
      const { error } = await supabase
        .from('project_roles')
        .insert(newRole);
      
      if (error) throw error;
      
      toast.success("Role added successfully");
      queryClient.invalidateQueries({ queryKey: ['project_roles', projectId] });
    } catch (error) {
      console.error('Error adding role:', error);
      toast.error("Failed to add role");
    }
  };

  return {
    roles,
    loading,
    deleteRole,
    updateRole,
    addRole
  };
}