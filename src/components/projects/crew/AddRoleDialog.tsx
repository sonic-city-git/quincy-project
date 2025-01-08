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
    dailyRate?: number;
    hourlyRate?: number;
  }) => void;
  loading?: boolean;
}

export function AddRoleDialog({ roles, onClose, onSubmit, loading }: AddRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [quantity, setQuantity] = useState("1");
  const [dailyRate, setDailyRate] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");

  const handleSubmit = () => {
    onSubmit({
      roleId: selectedRole,
      quantity: parseInt(quantity),
      dailyRate: dailyRate ? parseFloat(dailyRate) : undefined,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add Role</DialogTitle>
        <DialogDescription>
          Select a role and specify the quantity needed for this project.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <select
            id="role"
            className="w-full p-2 rounded-md border border-zinc-800 bg-zinc-950"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="">Select a role</option>
            {roles?.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
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
          <Label htmlFor="dailyRate">Daily Rate (optional)</Label>
          <Input
            id="dailyRate"
            type="number"
            min="0"
            step="0.01"
            value={dailyRate}
            onChange={(e) => setDailyRate(e.target.value)}
            placeholder="Enter daily rate"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hourlyRate">Hourly Rate (optional)</Label>
          <Input
            id="hourlyRate"
            type="number"
            min="0"
            step="0.01"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            placeholder="Enter hourly rate"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading || !selectedRole}>
          {loading ? "Adding..." : "Add Role"}
        </Button>
      </div>
    </DialogContent>
  );
}