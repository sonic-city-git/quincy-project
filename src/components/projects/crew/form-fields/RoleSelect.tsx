import { Label } from "@/components/ui/label";

interface RoleSelectProps {
  selectedRole: string;
  editMode?: boolean;
  onRoleChange: (value: string) => void;
}

export function RoleSelect({
  selectedRole,
  editMode = false,
  onRoleChange,
}: RoleSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="role" className="after:content-['*'] after:ml-0.5 after:text-red-500">
        Role
      </Label>
      {editMode ? (
        <div className="w-full p-2 rounded-md border border-zinc-800 bg-zinc-950">
          {selectedRole || 'No role selected'}
        </div>
      ) : (
        <select
          id="role"
          className="w-full p-2 rounded-md border border-zinc-800 bg-zinc-950"
          value={selectedRole}
          onChange={(e) => onRoleChange(e.target.value)}
        >
          <option value="">Select a role</option>
        </select>
      )}
    </div>
  );
}