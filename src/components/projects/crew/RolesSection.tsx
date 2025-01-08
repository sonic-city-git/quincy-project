import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { RoleItem } from "./RoleItem";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { AddRoleDialog } from "./AddRoleDialog";
import { Card } from "@/components/ui/card";

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

  return (
    <div className="space-y-6">
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

      {/* Project Roles Display */}
      <div className="grid gap-4">
        {projectRoles?.map((projectRole) => (
          <Card key={projectRole.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: projectRole.crew_roles.color }}
                />
                <div>
                  <h3 className="font-medium">{projectRole.crew_roles.name}</h3>
                  <div className="text-sm text-muted-foreground">
                    {projectRole.daily_rate && (
                      <p>Daily rate: ${projectRole.daily_rate}</p>
                    )}
                    {projectRole.hourly_rate && (
                      <p>Hourly rate: ${projectRole.hourly_rate}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateQuantity(projectRole.role_id, projectRole.quantity, false)}
                >
                  -
                </Button>
                <span className="w-8 text-center">{projectRole.quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateQuantity(projectRole.role_id, projectRole.quantity, true)}
                >
                  +
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {projectRoles?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No roles added to this project yet
          </div>
        )}
      </div>
    </div>
  );
}