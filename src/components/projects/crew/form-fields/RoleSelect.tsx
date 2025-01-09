import { Label } from "@/components/ui/label";

interface RoleSelectProps {
  roles: Array<{ id: string; name: string }>;
  selectedRole: string;
  editMode?: boolean;
  selectedRoleName?: string;
  onRoleChange: (value: string) => void;
  error?: string;
  isLoading?: boolean;
}

export function RoleSelect({
  roles,
  selectedRole,
  editMode = false,
  selectedRoleName,
  onRoleChange,
  error,
  isLoading
}: RoleSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="role" className="after:content-['*'] after:ml-0.5 after:text-red-500">
        Role
      </Label>
      {editMode ? (
        <div className="w-full p-2 rounded-md border border-zinc-800 bg-zinc-950">
          {selectedRoleName || 'No role selected'}
        </div>
      ) : (
        <select
          id="role"
          className="w-full p-2 rounded-md border border-zinc-800 bg-zinc-950"
          value={selectedRole}
          onChange={(e) => onRoleChange(e.target.value)}
          disabled={isLoading}
        >
          <option value="">{isLoading ? 'Loading roles...' : 'Select a role'}</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}