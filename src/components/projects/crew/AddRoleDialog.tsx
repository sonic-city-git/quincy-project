import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CrewRole } from "@/types/crew";

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
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="role" className="after:content-['*'] after:ml-0.5 after:text-red-500">Role</Label>
          <select
            id="role"
            className="w-full p-2 rounded-md border border-zinc-800 bg-zinc-950"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            disabled={editMode}
          >
            <option value="">Select a role</option>
            {roles?.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dailyRate" className="after:content-['*'] after:ml-0.5 after:text-red-500">Daily Rate</Label>
          <Input
            id="dailyRate"
            type="number"
            min="0"
            step="0.01"
            value={dailyRate}
            onChange={(e) => setDailyRate(e.target.value)}
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
            onChange={(e) => setHourlyRate(e.target.value)}
            placeholder="Enter hourly rate"
          />
          {errors.hourlyRate && <p className="text-sm text-red-500">{errors.hourlyRate}</p>}
        </div>
      </div>
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