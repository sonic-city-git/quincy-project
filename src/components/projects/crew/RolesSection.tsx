import { RolesHeader } from "./RolesHeader";
import { RatesList } from "./RatesList";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface RolesSectionProps {
  projectId: string;
}

export function RolesSection({ projectId }: RolesSectionProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: projectRoles, refetch: refetchRoles } = useQuery({
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

  const selectedRole = projectRoles?.find(role => role.role_id === selectedItems[0])
    ? {
        name: projectRoles.find(role => role.role_id === selectedItems[0])?.crew_roles.name || '',
        dailyRate: projectRoles.find(role => role.role_id === selectedItems[0])?.daily_rate,
        hourlyRate: projectRoles.find(role => role.role_id === selectedItems[0])?.hourly_rate,
      }
    : undefined;

  const handleItemSelect = (roleId: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(roleId)) {
        return [];
      }
      return [roleId];
    });
  };

  const handleAddRole = async (data: { roleId: string; dailyRate: string; hourlyRate: string }) => {
    try {
      const { error } = await supabase
        .from('project_roles')
        .insert({
          project_id: projectId,
          role_id: data.roleId,
          daily_rate: data.dailyRate ? parseFloat(data.dailyRate) : null,
          hourly_rate: data.hourlyRate ? parseFloat(data.hourlyRate) : null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role added successfully",
      });

      refetchRoles();
    } catch (error) {
      console.error('Error adding role:', error);
      toast({
        title: "Error",
        description: "Failed to add role",
        variant: "destructive",
      });
    }
  };

  const handleEditRole = async (data: { dailyRate: string; hourlyRate: string }) => {
    if (!selectedItems[0]) return;

    try {
      const selectedProjectRole = projectRoles?.find(role => role.role_id === selectedItems[0]);
      if (!selectedProjectRole) return;

      const { error } = await supabase
        .from('project_roles')
        .update({
          daily_rate: data.dailyRate ? parseFloat(data.dailyRate) : null,
          hourly_rate: data.hourlyRate ? parseFloat(data.hourlyRate) : null,
        })
        .eq('id', selectedProjectRole.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role updated successfully",
      });

      refetchRoles();
      setSelectedItems([]);
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900/50 rounded-lg p-3">
        <RolesHeader 
          projectId={projectId}
          onAddRole={handleAddRole}
          onEditRole={handleEditRole}
          selectedItems={selectedItems}
          selectedRole={selectedRole}
        />
        <div className="grid gap-1.5">
          <RatesList
            projectRoles={projectRoles || []}
            selectedItems={selectedItems}
            onUpdate={() => refetchRoles()}
            onItemSelect={handleItemSelect}
          />
        </div>
      </div>
    </div>
  );
}