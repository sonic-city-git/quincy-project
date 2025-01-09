import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CrewRole } from "@/types/crew";
import { useState, useEffect } from "react";
import { RoleFormFields } from "./RoleFormFields";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AddRoleDialogProps {
  roles?: CrewRole[];
  onClose: () => void;
  onSubmit: (data: {
    roleId: string;
    dailyRate: number;
    hourlyRate: number;
    quantity?: number;
  }) => void;
  loading?: boolean;
  editMode?: boolean;
  initialValues?: {
    roleId: string;
    dailyRate: number;
    hourlyRate: number;
    quantity?: number;
  };
  projectId?: string;
  roleId?: string;
}

export function AddRoleDialog({ 
  roles, 
  onClose, 
  onSubmit, 
  loading,
  editMode = false,
  initialValues,
  projectId,
  roleId
}: AddRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>(initialValues?.roleId || "");
  const [dailyRate, setDailyRate] = useState(initialValues?.dailyRate?.toString() || "");
  const [hourlyRate, setHourlyRate] = useState(initialValues?.hourlyRate?.toString() || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Fetch role data if in edit mode
  const { data: roleData } = useQuery({
    queryKey: ['project-role', projectId, roleId],
    queryFn: async () => {
      if (!editMode || !projectId || !roleId) return null;
      
      const { data, error } = await supabase
        .from('project_roles')
        .select(`
          *,
          crew_roles (
            id,
            name,
            color
          )
        `)
        .eq('project_id', projectId)
        .eq('role_id', roleId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: editMode && !!projectId && !!roleId
  });

  // Update form when role data is fetched
  useEffect(() => {
    if (roleData) {
      setSelectedRole(roleData.role_id);
      setDailyRate(roleData.daily_rate?.toString() || "");
      setHourlyRate(roleData.hourly_rate?.toString() || "");
    }
  }, [roleData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!selectedRole) {
      newErrors.role = "Role is required";
    }
    if (!dailyRate) {
      newErrors.dailyRate = "Daily rate is required";
    } else if (isNaN(parseFloat(dailyRate)) || parseFloat(dailyRate) < 0) {
      newErrors.dailyRate = "Daily rate must be a valid positive number";
    }
    if (!hourlyRate) {
      newErrors.hourlyRate = "Hourly rate is required";
    } else if (isNaN(parseFloat(hourlyRate)) || parseFloat(hourlyRate) < 0) {
      newErrors.hourlyRate = "Hourly rate must be a valid positive number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      try {
        onSubmit({
          roleId: selectedRole,
          dailyRate: parseFloat(dailyRate),
          hourlyRate: parseFloat(hourlyRate),
          quantity: 1, // Add default quantity
        });
        toast({
          title: editMode ? "Role Updated" : "Role Added",
          description: editMode ? "The role has been updated successfully." : "The role has been added successfully.",
        });
        onClose();
      } catch (error) {
        toast({
          title: "Error",
          description: "There was an error processing your request.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{editMode ? "Edit Role" : "Add Role"}</DialogTitle>
        <DialogDescription>
          {editMode 
            ? "Update the role details for this project."
            : "Select a role and specify the rates for this project."
          }
        </DialogDescription>
      </DialogHeader>
      <RoleFormFields
        roles={roles}
        selectedRole={selectedRole}
        dailyRate={dailyRate}
        hourlyRate={hourlyRate}
        errors={errors}
        editMode={editMode}
        onRoleChange={setSelectedRole}
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