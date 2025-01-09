import { useCrewRoles } from "@/hooks/useCrewRoles";

interface RoleTagsProps {
  role_id: string | null;
}

export function RoleTags({ role_id }: RoleTagsProps) {
  const { roles } = useCrewRoles();
  
  if (!role_id) {
    return null;
  }
  
  const role = roles.find(r => r.id === role_id);
  if (!role) return null;
        
  return (
    <div className="flex gap-1 whitespace-nowrap">
      <span
        className="px-2 py-0.5 rounded text-xs font-medium text-white"
        style={{ 
          backgroundColor: role.color || '#666666',
        }}
      >
        {role.name.toUpperCase()}
      </span>
    </div>
  );
}