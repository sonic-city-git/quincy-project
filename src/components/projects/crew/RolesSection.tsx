import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { AddRoleDialog } from "./AddRoleDialog";
import { ProjectRoleCard } from "./ProjectRoleCard";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { RoleSelectionActions } from "./RoleSelectionActions";

interface RolesSectionProps {
  projectId: string;
}

export function RolesSection({ projectId }: RolesSectionProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

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

  const handleEditRole = (roleId: string) => {
    const role = projectRoles?.find(r => r.role_id === roleId);
    if (role) {
      setOpen(true);
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
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Roles</h2>
        <div className="flex items-center gap-2">
          <RoleSelectionActions
            selectedItems={selectedItems}
            onEdit={handleEditRole}
            onDelete={handleDeleteRole}
          />
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

      <div className="bg-zinc-900/50 rounded-lg p-4">
        <div className="grid gap-2">
          <div className="flex items-center px-3">
            <div className="min-w-[232px]" />
            <div className="flex items-center gap-6">
              <span className="text-xs text-muted-foreground w-24">Daily rate</span>
              <span className="text-xs text-muted-foreground w-24">Hourly rate</span>
            </div>
          </div>
          {projectRoles?.map((projectRole) => (
            <div key={projectRole.id} className="flex items-center gap-4">
              <Checkbox
                checked={selectedItems.includes(projectRole.role_id)}
                onCheckedChange={() => handleItemSelect(projectRole.role_id)}
              />
              <div className="flex-grow">
                <ProjectRoleCard
                  id={projectRole.role_id}
                  projectId={projectId}
                  name={projectRole.crew_roles.name}
                  color={projectRole.crew_roles.color}
                  quantity={projectRole.quantity}
                  dailyRate={projectRole.daily_rate}
                  hourlyRate={projectRole.hourly_rate}
                  onUpdate={refetchProjectRoles}
                />
              </div>
            </div>
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