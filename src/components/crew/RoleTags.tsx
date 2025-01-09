import { Badge } from "@/components/ui/badge";
import { CrewRole } from "@/types/crew";
import { sortRoles } from "@/utils/roleUtils";

interface RoleTagsProps {
  roles: CrewRole[];
}

export function RoleTags({ roles }: RoleTagsProps) {
  // Ensure roles is always an array and filter out any invalid entries
  const validRoles = Array.isArray(roles) ? roles.filter(role => 
    role && typeof role === 'object' && 'name' in role && 'color' in role
  ) : [];

  const sortedRoles = sortRoles(validRoles);

  return (
    <div className="flex flex-nowrap gap-1 overflow-hidden">
      {sortedRoles.map((role) => (
        <Badge
          key={role.id}
          variant="default"
          className="text-white border-0 whitespace-nowrap"
          style={{ 
            backgroundColor: role.color || '#666',
            opacity: 1
          }}
        >
          {role.name}
        </Badge>
      ))}
    </div>
  );
}