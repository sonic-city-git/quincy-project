import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CrewMemberSelectProps {
  projectRoleId: string;
  selectedCrewMember: { id: string; name: string; folder: string } | null;
  onSelect: (projectRoleId: string, crewMemberId: string) => void;
  roleName: string;
}

export function CrewMemberSelect({ 
  projectRoleId, 
  selectedCrewMember, 
  onSelect,
  roleName 
}: CrewMemberSelectProps) {
  const { data: crewMembers } = useQuery({
    queryKey: ['crew-members-by-role', roleName],
    queryFn: async () => {
      const { data: members, error: membersError } = await supabase
        .from('crew_members')
        .select(`
          *,
          crew_member_roles (
            role_id,
            crew_roles (
              name
            )
          )
        `);
      
      if (membersError) throw membersError;
      
      return members?.filter(member => 
        member.crew_member_roles?.some(role => 
          role.crew_roles?.name === roleName
        )
      ) || [];
    },
  });

  const availableCrew = crewMembers?.sort((a, b) => {
    if (a.folder === "Sonic City" && b.folder !== "Sonic City") return -1;
    if (a.folder !== "Sonic City" && b.folder === "Sonic City") return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="w-[200px] justify-between"
        >
          {selectedCrewMember ? (
            <span>
              {selectedCrewMember.name} 
              {selectedCrewMember.folder === "Sonic City" && "⭐"}
            </span>
          ) : (
            "Select crew member"
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {availableCrew?.map((crew) => (
          <DropdownMenuItem 
            key={crew.id}
            onClick={() => onSelect(projectRoleId, crew.id)}
          >
            {crew.name} {crew.folder === "Sonic City" && "⭐"}
          </DropdownMenuItem>
        ))}
        {availableCrew?.length === 0 && (
          <DropdownMenuItem disabled>
            No crew members available
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}