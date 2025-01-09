import { memo } from "react";
import { CrewRole } from "@/types/crew";

interface RoleTagsProps {
  roles: CrewRole[];
}

export const RoleTags = memo(({ roles }: RoleTagsProps) => {
  if (!roles?.length) return null;
  
  return (
    <div className="flex gap-1 flex-wrap">
      {roles.map((role) => (
        <span
          key={role.id}
          className="px-2 py-0.5 rounded text-xs font-medium text-white"
          style={{ backgroundColor: role.color || '#666666' }}
        >
          {role.name.toUpperCase()}
        </span>
      ))}
    </div>
  );
});

RoleTags.displayName = 'RoleTags';