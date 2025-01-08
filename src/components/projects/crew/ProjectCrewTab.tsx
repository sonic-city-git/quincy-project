import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CrewMember } from "@/types/crew";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RolesSection } from "./RolesSection";
import { Input } from "@/components/ui/input";

interface ProjectCrewTabProps {
  projectId: string;
}

export function ProjectCrewTab({ projectId }: ProjectCrewTabProps) {
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

  const { data: projectRoles } = useQuery({
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

  if (isLoadingCrewMembers) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
      </div>
    );
  }

  const activeRoles = projectRoles?.filter(role => role.quantity > 0) || [];

  return (
    <div className="space-y-6">
      <div className="flex gap-6">
        {/* Roles Section */}
        <RolesSection projectId={projectId} />
        
        {/* Rates Section */}
        <div className="w-1/2 bg-zinc-900 rounded-md p-4">
          <h2 className="text-lg font-semibold mb-4">Role Rates</h2>
          {activeRoles.length > 0 ? (
            <div className="space-y-3">
              {activeRoles.map((role) => (
                <div 
                  key={role.id}
                  className="flex items-center justify-between p-2 rounded-md"
                  style={{ backgroundColor: role.crew_roles.color + '20' }}
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: role.crew_roles.color }}
                    />
                    <span className="text-sm">{role.crew_roles.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ({role.quantity} {role.quantity === 1 ? 'person' : 'people'})
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      placeholder="Daily rate"
                      className="h-7 w-24"
                      value={role.daily_rate || ''}
                      onChange={() => {}}
                      disabled
                    />
                    <Input
                      type="number"
                      placeholder="Hourly rate"
                      className="h-7 w-24"
                      value={role.hourly_rate || ''}
                      onChange={() => {}}
                      disabled
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-8">
              Add roles to see their rates here
            </div>
          )}
        </div>
      </div>

      {/* Crew Members Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Project Crew</h2>
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