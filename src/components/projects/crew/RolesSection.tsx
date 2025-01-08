import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { AddRoleDialog } from "./AddRoleDialog";
import { ProjectRoleCard } from "./ProjectRoleCard";

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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
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

      {/* Project Roles Display */}
      <div className="bg-zinc-900/50 rounded-lg p-4">
        <div className="grid gap-2">
          {projectRoles?.map((projectRole) => (
            <ProjectRoleCard
              key={projectRole.id}
              name={projectRole.crew_roles.name}
              color={projectRole.crew_roles.color}
              quantity={projectRole.quantity}
              dailyRate={projectRole.daily_rate}
              hourlyRate={projectRole.hourly_rate}
            />
          ))}
          {projectRoles?.length === 0 && (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No roles added to this project yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}