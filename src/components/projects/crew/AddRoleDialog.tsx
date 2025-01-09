import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { RoleFormFields } from "./form-fields/RoleFormFields";
import { CrewRole } from "@/types/crew";
import { useState } from "react";

interface AddRoleDialogProps {
  roles?: CrewRole[];
  onClose: () => void;
  onSubmit: (data: {
    roleId: string;
    dailyRate: number;
    hourlyRate: number;
    quantity: number;
  }) => void;
  loading?: boolean;
}

export function AddRoleDialog({ 
  roles, 
  onClose, 
  onSubmit,
  loading,
}: AddRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [dailyRate, setDailyRate] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const { toast } = useToast();

  const handleSubmit = () => {
    try {
      onSubmit({
        roleId: selectedRole,
        dailyRate: parseFloat(dailyRate),
        hourlyRate: parseFloat(hourlyRate),
        quantity: 1,
      });
      toast({
        title: "Role Added",
        description: "The role has been added successfully.",
      });
      onClose();
    } catch (error) {
      console.error('Error adding role:', error);
      toast({
        title: "Error",
        description: "Failed to add role",
        variant: "destructive",
      });
    }
  };

  return (
    <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
      <DialogHeader>
        <DialogTitle>Add Role</DialogTitle>
        <DialogDescription>
          Add a new role to this project.
        </DialogDescription>
      </DialogHeader>
      <RoleFormFields
        selectedRole={selectedRole}
        dailyRate={dailyRate}
        hourlyRate={hourlyRate}
        editMode={false}
        onRoleChange={setSelectedRole}
        onDailyRateChange={setDailyRate}
        onHourlyRateChange={setHourlyRate}
        errors={{}}
      />
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={loading} className="gap-2">
          <Plus className="h-4 w-4" />
          {loading ? "Adding..." : "Add Role"}
        </Button>
      </div>
    </DialogContent>
  );
}