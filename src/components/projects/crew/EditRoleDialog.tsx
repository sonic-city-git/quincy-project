import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Pen } from "lucide-react";
import { RoleFormFields } from "./form-fields/RoleFormFields";
import { CrewRole } from "@/types/crew";
import { useState, useEffect } from "react";

interface EditRoleDialogProps {
  projectId: string;
  roleId: string;
  onClose: () => void;
  onSubmit: (data: {
    roleId: string;
    dailyRate: number;
    hourlyRate: number;
    quantity: number;
  }) => void;
  onDelete?: () => void;
  loading?: boolean;
}

export function EditRoleDialog({ 
  projectId,
  roleId,
  onClose, 
  onSubmit,
  onDelete,
  loading,
}: EditRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>(roleId);
  const [dailyRate, setDailyRate] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const { toast } = useToast();

  const { data: roleData } = useQuery({
    queryKey: ['project-role', projectId, roleId],
    queryFn: async () => {
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
  });

  useEffect(() => {
    if (roleData) {
      setDailyRate(roleData.daily_rate?.toString() || "");
      setHourlyRate(roleData.hourly_rate?.toString() || "");
    }
  }, [roleData]);

  const handleSubmit = () => {
    try {
      onSubmit({
        roleId: selectedRole,
        dailyRate: parseFloat(dailyRate),
        hourlyRate: parseFloat(hourlyRate),
        quantity: 1,
      });
      toast({
        title: "Role Updated",
        description: "The role has been updated successfully.",
      });
      onClose();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit Role</DialogTitle>
        <DialogDescription>
          Update the role details for this project.
        </DialogDescription>
      </DialogHeader>
      <RoleFormFields
        selectedRole={selectedRole}
        dailyRate={dailyRate}
        hourlyRate={hourlyRate}
        editMode={true}
        onRoleChange={setSelectedRole}
        onDailyRateChange={setDailyRate}
        onHourlyRateChange={setHourlyRate}
      />
      <div className="flex justify-between gap-2">
        {onDelete && (
          <Button 
            variant="destructive" 
            onClick={onDelete}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        )}
        <div className="flex-1 flex justify-end">
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Updating..." : "Update Role"}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}