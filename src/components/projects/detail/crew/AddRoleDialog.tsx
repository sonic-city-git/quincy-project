import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCrewRoles } from "@/hooks/useCrewRoles";
import { Project } from "@/types/projects";
import { useForm } from "react-hook-form";
import { CrewMemberSelect } from "./CrewMemberSelect";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  eventId?: string;
}

interface FormData {
  role_id: string;
  daily_rate: number;
  hourly_rate: number;
  preferred_id?: string;
}

export function AddRoleDialog({ isOpen, onClose, project, eventId }: AddRoleDialogProps) {
  const { roles } = useCrewRoles();

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    defaultValues: {
      daily_rate: 0,
      hourly_rate: 0
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      const { error } = await supabase
        .from('project_roles')
        .insert({
          project_id: project.id,
          role_id: data.role_id,
          daily_rate: data.daily_rate,
          hourly_rate: data.hourly_rate,
          preferred_id: data.preferred_id || null
        });

      if (error) throw error;

      toast.success("Role added successfully");
      onClose();
    } catch (error) {
      console.error('Error adding role:', error);
      toast.error("Failed to add role");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Role</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select onValueChange={(value) => setValue('role_id', value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles?.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="daily_rate">Daily Rate</Label>
            <Input
              type="number"
              step="0.01"
              required
              {...register('daily_rate', { valueAsNumber: true, required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hourly_rate">Hourly Rate</Label>
            <Input
              type="number"
              step="0.01"
              required
              {...register('hourly_rate', { valueAsNumber: true, required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label>Preferred Crew Member</Label>
            <CrewMemberSelect
              value={watch('preferred_id') || ''}
              onChange={(value) => setValue('preferred_id', value)}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Add Role
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}