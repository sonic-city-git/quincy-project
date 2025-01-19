import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCrewRoles } from "@/hooks/useCrewRoles";
import { useProjectRoles } from "@/hooks/useProjectRoles";
import { Project } from "@/types/projects";
import { useForm } from "react-hook-form";
import { CrewMemberSelect } from "./CrewMemberSelect";
import { toast } from "sonner";

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
  preferred_id: string;
  hourly_category: "flat" | "corporate" | "broadcast";
}

export function AddRoleDialog({ isOpen, onClose, project }: AddRoleDialogProps) {
  const { roles } = useCrewRoles();
  const { addRole } = useProjectRoles(project.id);

  const form = useForm<FormData>({
    defaultValues: {
      role_id: "",
      daily_rate: 0,
      hourly_rate: 0,
      preferred_id: "",
      hourly_category: "flat"
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      await addRole({
        role_id: data.role_id,
        daily_rate: data.daily_rate,
        hourly_rate: data.hourly_rate,
        preferred_id: data.preferred_id || null,
        hourly_category: data.hourly_category
      });
      
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              <Select
                value={form.watch("role_id")}
                onValueChange={(value) => form.setValue("role_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder="Daily rate"
                {...form.register("daily_rate", { valueAsNumber: true })}
              />

              <Input
                type="number"
                placeholder="Hourly rate"
                {...form.register("hourly_rate", { valueAsNumber: true })}
              />

              <CrewMemberSelect
                value={form.watch("preferred_id")}
                onChange={(value) => form.setValue("preferred_id", value)}
              />

              <Select
                value={form.watch("hourly_category")}
                onValueChange={(value) => form.setValue("hourly_category", value as "flat" | "corporate" | "broadcast")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select hourly category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Flat</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="broadcast">Broadcast</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit">
                Add Role
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}