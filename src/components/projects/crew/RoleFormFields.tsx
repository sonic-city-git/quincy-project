import { sortRolesByPriority } from "@/utils/roleSort";
import { RoleSelect } from "./form-fields/RoleSelect";
import { RateInput } from "./form-fields/RateInput";

interface RoleFormFieldsProps {
  roles?: Array<{ id: string; name: string }>;
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
  roles = [],
  selectedRole,
  dailyRate,
  hourlyRate,
  errors,
  editMode = false,
  onRoleChange,
  onDailyRateChange,
  onHourlyRateChange,
}: RoleFormFieldsProps) {
  const selectedRoleData = roles.find(role => role.id === selectedRole);
  const sortedRoles = sortRolesByPriority(roles);

  return (
    <div className="space-y-4 py-4">
      <RoleSelect
        roles={sortedRoles}
        selectedRole={selectedRole}
        editMode={editMode}
        selectedRoleName={selectedRoleData?.name}
        onRoleChange={onRoleChange}
        error={errors.role}
      />
      
      <RateInput
        id="dailyRate"
        label="Daily Rate"
        value={dailyRate}
        onChange={onDailyRateChange}
        error={errors.dailyRate}
      />
      
      <RateInput
        id="hourlyRate"
        label="Hourly Rate"
        value={hourlyRate}
        onChange={onHourlyRateChange}
        error={errors.hourlyRate}
      />
    </div>
  );
}