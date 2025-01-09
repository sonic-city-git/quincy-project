import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useCrewRoles } from "@/hooks/useCrewRoles";

interface RoleSelectorProps {
  selectedRoleId: string | null;
  onRoleChange: (roleId: string | null) => void;
}

export function RoleSelector({ selectedRoleId, onRoleChange }: RoleSelectorProps) {
  const { roles, isLoading } = useCrewRoles();

  if (isLoading) {
    return <div className="animate-pulse h-20 bg-zinc-100 dark:bg-zinc-800 rounded-md" />;
  }

  return (
    <div className="grid gap-2">
      <Label>Role</Label>
      <div className="flex flex-wrap gap-4">
        {roles.map((role) => (
          <div key={role.id} className="flex items-center space-x-2">
            <Checkbox
              id={role.id}
              checked={selectedRoleId === role.id}
              onCheckedChange={(checked) => {
                onRoleChange(checked ? role.id : null);
              }}
            />
            <Label 
              htmlFor={role.id} 
              className="text-sm font-normal"
              style={{ color: role.color }}
            >
              {role.name}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}