import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { RoleItem } from "./RoleItem";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface RolesSectionProps {
  projectId: string;
}

// Define the custom sort order with exact case matching
const ROLE_ORDER = ['FOH', 'MON', 'Playback', 'Backline'];

export function RolesSection({ projectId }: RolesSectionProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

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
        const indexA = ROLE_ORDER.indexOf(a.name);
        const indexB = ROLE_ORDER.indexOf(b.name);
        
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

  const handleAddRole = async () => {
    if (!selectedRole) {
      toast({
        title: "Error",
        description: "Please select a role",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('project_roles')
        .insert({
          project_id: projectId,
          role_id: selectedRole,
          quantity: parseInt(quantity)
        });

      if (error) throw error;
      
      await refetchProjectRoles();
      setOpen(false);
      setSelectedRole(null);
      setQuantity("1");
      
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Role</DialogTitle>
              <DialogDescription>
                Select a role and specify the quantity needed for this project.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  className="w-full p-2 rounded-md border border-zinc-800 bg-zinc-950"
                  value={selectedRole || ""}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="">Select a role</option>
                  {roles?.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddRole} disabled={loading}>
                {loading ? "Adding..." : "Add Role"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}