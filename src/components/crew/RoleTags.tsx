import { Badge } from "@/components/ui/badge";
import { CrewRole } from "@/types/crew";

interface RoleTagsProps {
  roles: CrewRole[];
}

export function RoleTags({ roles }: RoleTagsProps) {
  // Ensure roles is always an array and filter out any invalid entries
  const validRoles = Array.isArray(roles) ? roles.filter(role => 
    role && typeof role === 'object' && 'name' in role && 'color' in role
  ) : [];

  return (
    <div className="flex flex-wrap gap-1">
      {validRoles.map((role) => (
        <Badge
          key={role.id}
          variant="default"
          className="text-white border-0"
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