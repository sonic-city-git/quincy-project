import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useCrewRoles } from "@/hooks/useCrewRoles";
import { sortRoles } from "@/utils/roleUtils";

interface RoleSelectorProps {
  selectedRoleIds: string[];
  onRolesChange: (roleIds: string[]) => void;
}

export function RoleSelector({ selectedRoleIds, onRolesChange }: RoleSelectorProps) {
  const { roles, isLoading } = useCrewRoles();

  if (isLoading) {
    return <div className="animate-pulse h-20 bg-zinc-900/50 rounded-md" />;
  }

  const sortedRoles = sortRoles(roles);

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    if (checked) {
      onRolesChange([...selectedRoleIds, roleId]);
    } else {
      onRolesChange(selectedRoleIds.filter(id => id !== roleId));
    }
  };

  return (
    <div className="grid gap-2">
      <Label>Roles</Label>
      <div className="flex flex-wrap gap-4">
        {sortedRoles.map((role) => (
          <div 
            key={role.id} 
            className={`
              flex items-center gap-2 px-3 py-2 rounded-md border border-zinc-800 
              transition-colors cursor-pointer hover:bg-zinc-900
              ${selectedRoleIds.includes(role.id) ? 'bg-zinc-900' : 'bg-zinc-950'}
            `}
            onClick={() => handleRoleToggle(role.id, !selectedRoleIds.includes(role.id))}
          >
            <Checkbox
              id={role.id}
              checked={selectedRoleIds.includes(role.id)}
              onCheckedChange={(checked) => {
                handleRoleToggle(role.id, checked as boolean);
              }}
            />
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: role.color || '#666' }}
              />
              <Label 
                htmlFor={role.id} 
                className="text-sm font-normal cursor-pointer"
              >
                {role.name}
              </Label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}