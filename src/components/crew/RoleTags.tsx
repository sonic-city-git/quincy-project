import { Badge } from "@/components/ui/badge";
import { CrewRole } from "@/types/crew";
import { sortRoles } from "@/utils/roleUtils";
import { memo } from "react";

interface RoleTagsProps {
  roles: CrewRole[];
}

export const RoleTags = memo(({ roles }: RoleTagsProps) => {
  // Ensure roles is always an array and filter out any invalid entries
  const validRoles = Array.isArray(roles) ? roles.filter(role => 
    role && typeof role === 'object' && 'name' in role && 'color' in role
  ) : [];

  const sortedRoles = sortRoles(validRoles);

  return (
    <div className="flex flex-nowrap gap-1 overflow-hidden">
      {sortedRoles.map((role) => (
        <Badge
          key={`${role.id}-${role.color}`}
          className="text-white border-0 whitespace-nowrap"
          style={{ 
            backgroundColor: role.color || '#666', // Fallback to gray if no color is set
            opacity: 0.9
          }}
        >
          {role.name}
        </Badge>
      ))}
    </div>
  );
});

RoleTags.displayName = 'RoleTags';