import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function useRoleManagement(projectId: string) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState<{
    roleId: string;
    dailyRate: number;
    hourlyRate: number;
    quantity: number;
  } | null>(null);



  const { data: roles, refetch: refetchRoles } = useQuery({
    queryKey: ['crew-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_roles')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: projectRoles, refetch: refetchProjectRoles } = useQuery({
    queryKey: ['project-roles', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_roles')
        .select(`
          *,
          crew_roles (
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

  const handleAddRole = async (data: {
    roleId: string;
    dailyRate: number;
    hourlyRate: number;
    quantity: number;
  }) => {
    setLoading(true);
    try {
      const existingRole = projectRoles?.find(role => role.role_id === data.roleId);
      
      if (existingRole) {
        toast.error("This role is already added to the project");
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('project_roles')
        .insert({
          project_id: projectId,
          role_id: data.roleId,
          daily_rate: data.dailyRate,
          hourly_rate: data.hourlyRate,
          quantity: data.quantity,
        });

      if (insertError) throw insertError;
      
      await refetchProjectRoles();
      setOpen(false);
      toast.success("Role added to project");
    } catch (error) {
      console.error('Error adding role:', error);
      toast.error("Failed to add role");
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = async (data: {
    roleId: string;
    dailyRate: number;
    hourlyRate: number;
    quantity: number;
  }) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('project_roles')
        .update({
          daily_rate: data.dailyRate,
          hourly_rate: data.hourlyRate,
          quantity: data.quantity,
        })
        .eq('project_id', projectId)
        .eq('role_id', data.roleId);

      if (error) throw error;

      await refetchProjectRoles();
      setOpen(false);
              toast.success("Role updated successfully");
    } catch (error) {
      console.error('Error updating role:', error);
              toast.error("Failed to update role");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('project_roles')
        .delete()
        .eq('project_id', projectId)
        .eq('role_id', roleId);

      if (error) throw error;

      toast.success("Role deleted from project");

      setSelectedItems([]);
      await refetchProjectRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
              toast.error("Failed to delete role");
    }
  };

  return {
    loading,
    open,
    setOpen,
    selectedItems,
    setSelectedItems,
    editMode,
    setEditMode,
    editValues,
    setEditValues,
    roles,
    projectRoles,
    handleAddRole,
    handleEditRole,
    handleDeleteRole,
    refetchProjectRoles,
  };
}