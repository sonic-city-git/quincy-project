import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CrewMember } from "@/types/crew";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RolesSection } from "./RolesSection";
import { RoleTags } from "@/components/crew/RoleTags";

interface ProjectCrewTabProps {
  projectId: string;
}

export function ProjectCrewTab({ projectId }: ProjectCrewTabProps) {
  const { data: crewMembers, isLoading: isLoadingCrewMembers } = useQuery({
    queryKey: ['crew-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_members')
        .select(`
          *,
          crew_member_roles (
            role_id,
            crew_roles (
              id,
              name,
              color
            )
          )
        `)
        .order('name');
      
      if (error) throw error;
      return data as CrewMember[];
    },
  });

  if (isLoadingCrewMembers) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RolesSection projectId={projectId} />

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
                    <TableCell className="w-[320px]">
                      <RoleTags crewMemberId={crew.id} />
                    </TableCell>
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