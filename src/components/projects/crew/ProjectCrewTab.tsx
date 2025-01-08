import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CrewMember } from "@/types/crew";
import { Button } from "@/components/ui/button";
import { UserPlus, Plus, Minus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ProjectCrewTabProps {
  projectId: string;
}

export function ProjectCrewTab({ projectId }: ProjectCrewTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const { data: crewMembers, isLoading: isLoadingCrewMembers } = useQuery({
    queryKey: ['crew-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_members')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as CrewMember[];
    },
  });

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
    const newQuantity = increment ? currentQuantity + 1 : Math.max(1, currentQuantity - 1);
    
    try {
      const { error } = await supabase
        .from('project_roles')
        .update({ quantity: newQuantity })
        .eq('project_id', projectId)
        .eq('role_id', roleId);

      if (error) throw error;
      
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

  if (isLoadingCrewMembers) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
      </div>
    );
  }

  const getProjectRole = (roleId: string) => {
    return projectRoles?.find(pr => pr.role_id === roleId);
  };

  return (
    <div className="space-y-8">
      {/* Roles Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Roles</h2>
        </div>

        <div className="bg-zinc-900 rounded-md p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {roles?.map((role) => {
              const projectRole = getProjectRole(role.id);
              return projectRole ? (
                <div
                  key={role.id}
                  className="flex items-center justify-between p-3 rounded-md"
                  style={{ backgroundColor: role.color + '20' }}
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: role.color }}
                    />
                    <span className="text-sm font-medium">{role.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleUpdateQuantity(role.id, projectRole.quantity, false)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">{projectRole.quantity}</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleUpdateQuantity(role.id, projectRole.quantity, true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  key={role.id}
                  variant="outline"
                  className="flex items-center justify-between p-3 h-auto"
                  onClick={() => handleAddRole(role.id)}
                  disabled={loading}
                >
                  <span className="text-sm font-medium">{role.name}</span>
                  <Plus className="h-4 w-4 ml-2" />
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Crew Members Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Project Crew</h2>
          <Button size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add crew member
          </Button>
        </div>

        <div className="bg-zinc-900 rounded-md">
          <ScrollArea className="h-[calc(100vh-26rem)]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-zinc-800/50">
                  <TableHead className="w-[240px]">Name</TableHead>
                  <TableHead className="w-[320px]">Role</TableHead>
                  <TableHead className="w-[280px]">Email</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crewMembers?.map((crew) => (
                  <TableRow key={crew.id} className="h-8 hover:bg-zinc-800/50 border-b border-zinc-800/50">
                    <TableCell className="w-[240px] truncate">{crew.name}</TableCell>
                    <TableCell className="w-[320px]">{crew.role}</TableCell>
                    <TableCell className="w-[280px] truncate">{crew.email}</TableCell>
                    <TableCell className="truncate">{crew.phone}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}