import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { RoleItem } from "./RoleItem";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { AddRoleDialog } from "./AddRoleDialog";

interface RolesSectionProps {
  projectId: string;
}

export function RolesSection({ projectId }: RolesSectionProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

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
    quantity: number;
    dailyRate?: number;
    hourlyRate?: number;
  }) => {
    setLoading(true);
    try {
      // First check if the role already exists
      const { data: existingRole } = await supabase
        .from('project_roles')
        .select('*')
        .eq('project_id', projectId)
        .eq('role_id', data.roleId)
        .single();

      if (existingRole) {
        // Update existing role
        const { error: updateError } = await supabase
          .from('project_roles')
          .update({
            quantity: data.quantity,
            daily_rate: data.dailyRate,
            hourly_rate: data.hourlyRate,
          })
          .eq('project_id', projectId)
          .eq('role_id', data.roleId);

        if (updateError) throw updateError;
        
        toast({
          title: "Success",
          description: "Role updated in project",
        });
      } else {
        // Insert new role
        const { error: insertError } = await supabase
          .from('project_roles')
          .insert({
            project_id: projectId,
            role_id: data.roleId,
            quantity: data.quantity,
            daily_rate: data.dailyRate,
            hourly_rate: data.hourlyRate,
          });

        if (insertError) throw insertError;
        
        toast({
          title: "Success",
          description: "Role added to project",
        });
      }
      
      await refetchProjectRoles();
      setOpen(false);
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
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Roles</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add role
            </Button>
          </DialogTrigger>
          <AddRoleDialog
            roles={roles}
            onClose={() => setOpen(false)}
            onSubmit={handleAddRole}
            loading={loading}
          />
        </Dialog>
      </div>
    </div>
  );
}