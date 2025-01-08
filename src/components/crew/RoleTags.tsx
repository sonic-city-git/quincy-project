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
        const bgColor = roleConfig ? `bg-[${roleConfig.color}]` : 'bg-zinc-700';
        
        return (
          <span
            key={index}
            className={`px-2 py-0.5 rounded text-xs font-medium ${bgColor} text-white`}
          >
            {upperTag}
          </span>
        );
      })}
    </div>
  );
}