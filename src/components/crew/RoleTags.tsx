import { useCrewRoles } from "@/hooks/useCrewRoles";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { memo } from "react";

interface RoleTagsProps {
  crewMemberId: string;
}

export const RoleTags = memo(({ crewMemberId }: RoleTagsProps) => {
  const { roles } = useCrewRoles();
  const queryClient = useQueryClient();
  
  const { data: memberRoles } = useQuery({
    queryKey: ['crew-member-roles', crewMemberId],
    queryFn: async () => {
      if (!crewMemberId) return [];
      
      const { data, error } = await supabase
        .from('crew_member_roles')
        .select('role_id')
        .eq('crew_member_id', crewMemberId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!crewMemberId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
  
  if (!memberRoles?.length) {
    return null;
  }
  
  return (
    <div className="flex gap-1 flex-wrap">
      {memberRoles.map((memberRole) => {
        const role = roles.find(r => r.id === memberRole.role_id);
        if (!role) return null;
        
        return (
          <span
            key={role.id}
            className="px-2 py-0.5 rounded text-xs font-medium text-white"
            style={{ backgroundColor: role.color || '#666666' }}
          >
            {role.name.toUpperCase()}
          </span>
        );
      })}
    </div>
  );
});

RoleTags.displayName = 'RoleTags';