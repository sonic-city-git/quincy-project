import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CrewRole } from "@/types/crew";

interface RoleFormFieldsProps {
  roles?: CrewRole[];
  selectedRole: string;
  dailyRate: string;
  hourlyRate: string;
  errors: Record<string, string>;
  editMode?: boolean;
  onRoleChange: (value: string) => void;
  onDailyRateChange: (value: string) => void;
  onHourlyRateChange: (value: string) => void;
}

export function RoleFormFields({
  roles,
  selectedRole,
  dailyRate,
  hourlyRate,
  errors,
  editMode = false,
  onRoleChange,
  onDailyRateChange,
  onHourlyRateChange,
}: RoleFormFieldsProps) {
  const selectedRoleData = roles?.find(role => role.id === selectedRole);

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="role" className="after:content-['*'] after:ml-0.5 after:text-red-500">Role</Label>
        {editMode ? (
          <div className="w-full p-2 rounded-md border border-zinc-800 bg-zinc-950">
            {selectedRoleData?.name}
          </div>
        ) : (
          <select
            id="role"
            className="w-full p-2 rounded-md border border-zinc-800 bg-zinc-950"
            value={selectedRole}
            onChange={(e) => onRoleChange(e.target.value)}
          >
            <option value="">Select a role</option>
            {roles?.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        )}
        {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="dailyRate" className="after:content-['*'] after:ml-0.5 after:text-red-500">Daily Rate</Label>
        <Input
          id="dailyRate"
          type="number"
          min="0"
          step="0.01"
          value={dailyRate}
          onChange={(e) => onDailyRateChange(e.target.value)}
          placeholder="Enter daily rate"
        />
        {errors.dailyRate && <p className="text-sm text-red-500">{errors.dailyRate}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="hourlyRate" className="after:content-['*'] after:ml-0.5 after:text-red-500">Hourly Rate</Label>
        <Input
          id="hourlyRate"
          type="number"
          min="0"
          step="0.01"
          value={hourlyRate}
          onChange={(e) => onHourlyRateChange(e.target.value)}
          placeholder="Enter hourly rate"
        />
        {errors.hourlyRate && <p className="text-sm text-red-500">{errors.hourlyRate}</p>}
      </div>
    </div>
  );
}