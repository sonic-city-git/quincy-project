import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { ProjectRoleCard } from "./ProjectRoleCard";
import { CrewMemberSelect } from "./CrewMemberSelect";
import { useQuery } from "@tanstack/react-query";
import { CrewMember, CrewRole } from "@/types/crew";

interface RolesListProps {
  projectRoles: any[];
  selectedItems: string[];
  onUpdate: () => void;
  onItemSelect: (roleId: string) => void;
}

export function RolesList({ 
  projectRoles, 
  selectedItems, 
  onUpdate, 
  onItemSelect 
}: RolesListProps) {
  const { toast } = useToast();

  const handlePreferredCrewSelect = async (projectRoleId: string, crewMemberId: string) => {
    try {
      const { error } = await supabase
        .from('project_roles')
        .update({ preferred_id: crewMemberId })
        .eq('id', projectRoleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Preferred crew member updated",
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating preferred crew:', error);
      toast({
        title: "Error",
        description: "Failed to update preferred crew member",
        variant: "destructive",
      });
    }
  };

  const { data: crewMembers } = useQuery({
    queryKey: ['crew-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_members')
        .select('*');
      
      if (error) throw error;
      
      return data.map(member => ({
        ...member,
        roles: Array.isArray(member.roles) 
          ? (member.roles as any[]).map(role => ({
              id: role.id,
              name: role.name,
              color: role.color,
              created_at: role.created_at
            })) 
          : []
      })) as CrewMember[];
    },
  });

  const getSelectedCrewMember = (projectRole: any) => {
    if (!crewMembers) return null;
    return crewMembers.find(crew => crew.id === projectRole.preferred_id);
  };

  const sortedRoles = [...projectRoles].sort((a, b) => {
    const roleA = a.crew_roles.name.toUpperCase();
    const roleB = b.crew_roles.name.toUpperCase();
    
    const indexA = roleOrder.indexOf(roleA);
    const indexB = roleOrder.indexOf(roleB);
    
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    
    return roleA.localeCompare(roleB);
  });

  return (
    <div className="grid gap-1.5">
      {sortedRoles?.map((projectRole) => {
        const selectedCrew = getSelectedCrewMember(projectRole);
        
        return (
          <div key={projectRole.id} className="flex items-center gap-2">
            <Checkbox
              checked={selectedItems.includes(projectRole.role_id)}
              onCheckedChange={() => onItemSelect(projectRole.role_id)}
            />
            <div className="flex-grow">
              <ProjectRoleCard
                id={projectRole.role_id}
                projectId={projectRole.project_id}
                name={projectRole.crew_roles.name}
                color={projectRole.crew_roles.color}
                dailyRate={projectRole.daily_rate}
                hourlyRate={projectRole.hourly_rate}
                onUpdate={onUpdate}
              />
            </div>
            <CrewMemberSelect
              projectRoleId={projectRole.id}
              selectedCrewMember={selectedCrew}
              onSelect={handlePreferredCrewSelect}
              roleName={projectRole.crew_roles.name}
            />
          </div>
        );
      })}
      {sortedRoles?.length === 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          No roles added to this project yet
        </div>
      )}
    </div>
  );
}