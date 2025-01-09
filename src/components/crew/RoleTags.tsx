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
          style={{ backgroundColor: role.color }}
          className="text-white"
        >
          {role.name}
        </Badge>
      ))}
    </div>
  );
}