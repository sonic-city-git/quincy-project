import { sortRolesByPriority } from "@/utils/roleSort";
import { RoleSelect } from "./RoleSelect";
import { RateInput } from "./RateInput";

interface RoleFormFieldsProps {
  selectedRole: string;
  dailyRate: string;
  hourlyRate: string;
  editMode?: boolean;
  onRoleChange: (value: string) => void;
  onDailyRateChange: (value: string) => void;
  onHourlyRateChange: (value: string) => void;
}

export function RoleFormFields({
  selectedRole,
  dailyRate,
  hourlyRate,
  editMode = false,
  onRoleChange,
  onDailyRateChange,
  onHourlyRateChange,
}: RoleFormFieldsProps) {
  return (
    <div className="space-y-4 py-4">
      <RoleSelect
        selectedRole={selectedRole}
        editMode={editMode}
        onRoleChange={onRoleChange}
      />
      
      <RateInput
        id="dailyRate"
        label="Daily Rate"
        value={dailyRate}
        onChange={onDailyRateChange}
      />
      
      <RateInput
        id="hourlyRate"
        label="Hourly Rate"
        value={hourlyRate}
        onChange={onHourlyRateChange}
      />
    </div>
  );
}