import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { EntitySelect } from "@/components/shared/EntitySelect";
import { UseFormReturn } from "react-hook-form";
import { CrewRole } from "@/types/crew";

interface AddRoleFormData {
  roleId: string;
  dailyRate: string;
  hourlyRate: string;
}

interface AddRoleFormFieldsProps {
  form: UseFormReturn<AddRoleFormData>;
  roles: CrewRole[];
  isLoading: boolean;
}

export function AddRoleFormFields({ form, roles, isLoading }: AddRoleFormFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="roleId"
        rules={{ required: "Role is required" }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Role</FormLabel>
            <FormControl>
              <EntitySelect
                entities={roles.map(role => ({
                  id: role.id,
                  name: role.name
                }))}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Select role"
                isLoading={isLoading}
                required
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="dailyRate"
        rules={{ required: "Daily rate is required" }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Daily Rate</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="Enter daily rate"
                required
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="hourlyRate"
        rules={{ required: "Hourly rate is required" }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Hourly Rate</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="Enter hourly rate"
                required
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}