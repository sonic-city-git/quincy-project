import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RatesHeader } from "./RatesHeader";
import { RolesHeader } from "./RolesHeader";
import { RolesList } from "./RolesList";

interface RolesSectionProps {
  projectId: string;
}

export function RolesSection({ projectId }: RolesSectionProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState<{
    roleId: string;
    dailyRate: number;
    hourlyRate: number;
  } | null>(null);

  const { data: roles } = useQuery({
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
  }) => {
    setLoading(true);
    try {
      const existingRole = projectRoles?.find(role => role.role_id === data.roleId);
      
      if (existingRole) {
        toast({
          title: "Error",
          description: "This role is already added to the project",
          variant: "destructive",
        });
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
          quantity: 1, // Default quantity
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }
      
      await refetchProjectRoles();
      setOpen(false);
      toast({
        title: "Success",
        description: "Role added to project",
      });
    } catch (error) {
      console.error('Error adding role:', error);
      toast({
        title: "Error",
        description: "Failed to add role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (roleId: string) => {
    const role = projectRoles?.find(r => r.role_id === roleId);
    if (role) {
      setEditMode(true);
      setEditValues({
        roleId: role.role_id,
        dailyRate: Number(role.daily_rate),
        hourlyRate: Number(role.hourly_rate),
      });
      setOpen(true);
    }
  };

  const handleDialogClose = () => {
    setOpen(false);
    setEditMode(false);
    setEditValues(null);
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('project_roles')
        .delete()
        .eq('project_id', projectId)
        .eq('role_id', roleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role deleted from project",
      });

      setSelectedItems([]);
      await refetchProjectRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      });
    }
  };

  const handleItemSelect = (roleId: string) => {
    setSelectedItems(prev => {
      if (prev.includes(roleId)) {
        return prev.filter(id => id !== roleId);
      }
      return [roleId];
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900/50 rounded-lg p-3">
        <RolesHeader
          selectedItems={selectedItems}
          onEdit={handleEditRole}
          onDelete={handleDeleteRole}
          open={open}
          onOpenChange={setOpen}
          onClose={handleDialogClose}
          onSubmit={handleAddRole}
          loading={loading}
          editMode={editMode}
          editValues={editValues}
          roles={roles || []}
        />
        <div className="grid gap-1.5">
          <RatesHeader />
          <RolesList
            projectRoles={projectRoles || []}
            selectedItems={selectedItems}
            onItemSelect={handleItemSelect}
            onUpdate={refetchProjectRoles}
          />
        </div>
      </div>
    </div>
  );
}