import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { RoleItem } from "./RoleItem";

interface RolesSectionProps {
  projectId: string;
}

// Define the custom sort order
const ROLE_ORDER = ['FOH', 'MON', 'PLAYBACK', 'BACKLINE'];

export function RolesSection({ projectId }: RolesSectionProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const { data: roles } = useQuery({
    queryKey: ['crew-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_roles')
        .select('*')
        .order('name');
      
      if (error) throw error;

      // Sort the roles according to the custom order
      return data.sort((a, b) => {
        const indexA = ROLE_ORDER.indexOf(a.name.toUpperCase());
        const indexB = ROLE_ORDER.indexOf(b.name.toUpperCase());
        
        // If both roles are in the custom order list
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        
        // If only one role is in the list, prioritize it
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        
        // For roles not in the list, maintain alphabetical order
        return a.name.localeCompare(b.name);
      });
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

  const handleAddRole = async (roleId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('project_roles')
        .insert({
          project_id: projectId,
          role_id: roleId,
          quantity: 1
        });

      if (error) throw error;
      
      await refetchProjectRoles();
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

  const handleUpdateQuantity = async (roleId: string, currentQuantity: number, increment: boolean) => {
    const newQuantity = increment ? currentQuantity + 1 : Math.max(0, currentQuantity - 1);
    
    try {
      if (newQuantity === 0) {
        const { error } = await supabase
          .from('project_roles')
          .delete()
          .eq('project_id', projectId)
          .eq('role_id', roleId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('project_roles')
          .update({ quantity: newQuantity })
          .eq('project_id', projectId)
          .eq('role_id', roleId);

        if (error) throw error;
      }
      
      await refetchProjectRoles();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    }
  };

  const getProjectRole = (roleId: string) => {
    return projectRoles?.find(pr => pr.role_id === roleId);
  };

  return (
    <div className="w-1/2">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Roles</h2>
        <div className="bg-zinc-900 rounded-md p-2 space-y-1">
          <div className="flex flex-col gap-1">
            {roles?.map((role) => {
              const projectRole = getProjectRole(role.id);
              return (
                <RoleItem
                  key={role.id}
                  name={role.name}
                  color={role.color}
                  quantity={projectRole?.quantity}
                  onAdd={() => handleAddRole(role.id)}
                  onUpdateQuantity={(increment) => 
                    handleUpdateQuantity(role.id, projectRole?.quantity || 0, increment)
                  }
                  loading={loading}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}