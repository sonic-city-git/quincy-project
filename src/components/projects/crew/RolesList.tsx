import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectRoleCard } from "./ProjectRoleCard";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RolesListProps {
  projectRoles: any[];
  selectedItems: string[];
  onItemSelect: (roleId: string) => void;
  onUpdate: () => void;
}

const roleOrder = ["FOH", "MON", "PLAYBACK", "BACKLINE"];

export function RolesList({ projectRoles, selectedItems, onItemSelect, onUpdate }: RolesListProps) {
  const { toast } = useToast();
  const { data: crewMembers } = useQuery({
    queryKey: ['crew-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_members')
        .select('*')
        .order('folder', { ascending: false }) // This will make 'Sonic City' appear first
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  const handlePreferredCrewSelect = async (projectRoleId: string, crewMemberId: string) => {
    try {
      const { error } = await supabase
        .from('project_roles')
        .update({ 
          preferred_status: crewMemberId // Supabase will handle the UUID conversion internally
        })
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

  const sortedRoles = [...projectRoles].sort((a, b) => {
    const roleA = a.crew_roles.name.toUpperCase();
    const roleB = b.crew_roles.name.toUpperCase();
    
    const indexA = roleOrder.indexOf(roleA);
    const indexB = roleOrder.indexOf(roleB);
    
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    
    return roleA.localeCompare(roleB);
  });

  const getCrewMembersForRole = (roleName: string) => {
    if (!crewMembers) return [];
    return crewMembers
      .filter(crew => crew.role?.includes(roleName))
      .sort((a, b) => {
        if (a.folder === "Sonic City" && b.folder !== "Sonic City") return -1;
        if (a.folder !== "Sonic City" && b.folder === "Sonic City") return 1;
        return a.name.localeCompare(b.name);
      });
  };

  const getSelectedCrewMember = (projectRole: any) => {
    if (!crewMembers) return null;
    return crewMembers.find(crew => crew.id === projectRole.preferred_status);
  };

  return (
    <div className="grid gap-1.5">
      {sortedRoles?.map((projectRole) => {
        const availableCrew = getCrewMembersForRole(projectRole.crew_roles.name);
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-[200px] justify-between"
                >
                  {selectedCrew ? (
                    <span>
                      {selectedCrew.name} 
                      {selectedCrew.folder === "Sonic City" && "⭐"}
                    </span>
                  ) : (
                    "Select crew member"
                  )}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                {availableCrew.map((crew) => (
                  <DropdownMenuItem 
                    key={crew.id}
                    onClick={() => handlePreferredCrewSelect(projectRole.id, crew.id)}
                  >
                    {crew.name} {crew.folder === "Sonic City" && "⭐"}
                  </DropdownMenuItem>
                ))}
                {availableCrew.length === 0 && (
                  <DropdownMenuItem disabled>
                    No crew members available
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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