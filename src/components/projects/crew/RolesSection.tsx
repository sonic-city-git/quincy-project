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

  const handleEdit = () => {
    toast({
      title: "Edit role",
      description: "Edit role functionality coming soon",
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900/50 rounded-lg p-3">
        <RolesHeader 
          projectId={projectId}
          onAddRole={handleAddRole}
          selectedItems={selectedItems}
          onEdit={handleEdit}
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