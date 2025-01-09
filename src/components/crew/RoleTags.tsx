import { useCrewRoles } from "@/hooks/useCrewRoles";

interface RoleTagsProps {
  role: string;
}

export function RoleTags({ role }: RoleTagsProps) {
  const { roles } = useCrewRoles();
  
  if (!role) {
    return null;
  }
  
  const tags = role.split(", ");
  
  return (
    <div className="flex gap-1 whitespace-nowrap">
      {tags.map((tag, index) => {
        const upperTag = tag.toUpperCase();
        const roleConfig = roles.find(r => r.name === upperTag);
        
        return (
          <span
            key={index}
            className="px-2 py-0.5 rounded text-xs font-medium text-white"
            style={{ 
              backgroundColor: roleConfig?.color || '#666666',
            }}
          >
            {upperTag}
          </span>
        );
      })}
    </div>
  );
}