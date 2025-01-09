import { Badge } from "@/components/ui/badge";
import { CrewRole } from "@/types/crew";

interface RoleTagsProps {
  roles: CrewRole[];
}

export function RoleTags({ roles }: RoleTagsProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {roles?.map((role) => (
        <Badge
          key={role.id}
          className="text-white"
          style={{ 
            backgroundColor: role.color,
            // Add a slight text shadow to ensure readability
            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}
        >
          {role.name}
        </Badge>
      ))}
    </div>
  );
}