import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CrewRole } from "@/types/crew";
import { useState } from "react";
import { RoleFormFields } from "./RoleFormFields";

interface AddRoleDialogProps {
  roles?: CrewRole[];
  onClose: () => void;
  onSubmit: (data: {
    roleId: string;
    quantity: number;
    dailyRate: number;
    hourlyRate: number;
  }) => void;
  loading?: boolean;
  editMode?: boolean;
  initialValues?: {
    roleId: string;
    quantity: number;
    dailyRate: number;
    hourlyRate: number;
  };
}

export function AddRoleDialog({ 
  roles, 
  onClose, 
  onSubmit, 
  loading,
  editMode = false,
  initialValues 
}: AddRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>(initialValues?.roleId || "");
  const [quantity, setQuantity] = useState(initialValues?.quantity?.toString() || "1");
  const [dailyRate, setDailyRate] = useState(initialValues?.dailyRate?.toString() || "");
  const [hourlyRate, setHourlyRate] = useState(initialValues?.hourlyRate?.toString() || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!selectedRole) {
      newErrors.role = "Role is required";
    }
    if (!dailyRate) {
      newErrors.dailyRate = "Daily rate is required";
    }
    if (!hourlyRate) {
      newErrors.hourlyRate = "Hourly rate is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        roleId: selectedRole,
        quantity: parseInt(quantity),
        dailyRate: parseFloat(dailyRate),
        hourlyRate: parseFloat(hourlyRate),
      });
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{editMode ? "Edit Role" : "Add Role"}</DialogTitle>
        <DialogDescription>
          {editMode 
            ? "Update the role details for this project."
            : "Select a role and specify the quantity needed for this project."
          }
        </DialogDescription>
      </DialogHeader>
      <RoleFormFields
        roles={roles}
        selectedRole={selectedRole}
        quantity={quantity}
        dailyRate={dailyRate}
        hourlyRate={hourlyRate}
        errors={errors}
        editMode={editMode}
        onRoleChange={setSelectedRole}
        onQuantityChange={setQuantity}
        onDailyRateChange={setDailyRate}
        onHourlyRateChange={setHourlyRate}
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? (editMode ? "Updating..." : "Adding...") : (editMode ? "Update Role" : "Add Role")}
        </Button>
      </div>
    </DialogContent>
  );
}