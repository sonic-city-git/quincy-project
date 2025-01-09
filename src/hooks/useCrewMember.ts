import { useState } from "react";
import { CrewMember } from "@/types/crew";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCrewMember(crewMember: CrewMember) {
  const { data: memberRoles } = useQuery({
    queryKey: ['crew-member-roles', crewMember.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_member_roles')
        .select('role_id')
        .eq('crew_member_id', crewMember.id);
      
      if (error) throw error;
      return data;
    },
  });

  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(
    memberRoles?.map(role => role.role_id) || []
  );

  return {
    selectedRoleIds,
    setSelectedRoleIds,
  };
}