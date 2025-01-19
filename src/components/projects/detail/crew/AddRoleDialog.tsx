import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { useCrewRoles } from "@/hooks/useCrewRoles";
import { useCrew } from "@/hooks/useCrew";
import { useProjectRoles } from "@/hooks/useProjectRoles";
import { useCrewSort } from "@/components/crew/useCrewSort";
import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const formSchema = z.object({
  role_id: z.string({ required_error: "Please select a role" }),
  daily_rate: z.string().min(1, "Daily rate is required"),
  hourly_rate: z.string().min(1, "Hourly rate is required"),
  preferred_id: z.string({ required_error: "Please select a crew member" }),
  hourly_category: z.enum(['flat', 'corporate', 'broadcast'])
});

type FormData = z.infer<typeof formSchema>;

interface AddRoleDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddRoleDialog({ projectId, open, onOpenChange }: AddRoleDialogProps) {
  const { roles, isLoading: rolesLoading } = useCrewRoles();
  const { crew, loading: crewLoading } = useCrew();
  const { addRole, loading } = useProjectRoles(projectId);
  const { sortCrew } = useCrewSort();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role_id: '',
      daily_rate: '',
      hourly_rate: '',
      preferred_id: '',
      hourly_category: 'flat'
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      // First add the role to project_roles
      await addRole({
        role_id: data.role_id,
        daily_rate: parseFloat(data.daily_rate),
        hourly_rate: parseFloat(data.hourly_rate),
        preferred_id: data.preferred_id,
        hourly_category: data.hourly_category
      });

      // Check if the preferred member is from Sonic City
      const { data: crewMember } = await supabase
        .from('crew_members')
        .select('folder_id, crew_folders!inner(name)')
        .eq('id', data.preferred_id)
        .single();

      if (crewMember?.crew_folders?.name === 'Sonic City') {
        // Get all existing events for this project
        const { data: events } = await supabase
          .from('project_events')
          .select('id')
          .eq('project_id', projectId)
          .not('status', 'in', ['cancelled', 'invoice ready']);

        if (events?.length) {
          // Add role assignments for each event
          const roleAssignments = events.map(event => ({
            project_id: projectId,
            event_id: event.id,
            role_id: data.role_id,
            crew_member_id: data.preferred_id,
            daily_rate: parseFloat(data.daily_rate),
            hourly_rate: parseFloat(data.hourly_rate),
            hourly_category: data.hourly_category
          }));

          const { error: assignmentError } = await supabase
            .from('project_event_roles')
            .upsert(roleAssignments);

          if (assignmentError) throw assignmentError;
        }
      }

      // Invalidate relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['project_roles', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['events', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['crew-sync-status'] })
      ]);

      form.reset();
      onOpenChange(false);
      toast.success("Role added successfully");
    } catch (error: any) {
      console.error('Error adding role:', error);
      toast.error(error.message || "Failed to add role");
    }
  };

  const sortedCrew = crew ? sortCrew(crew) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Role</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="role_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role *</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={rolesLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem
                          key={role.id}
                          value={role.id}
                          className="cursor-pointer"
                        >
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="daily_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily Rate *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="Enter daily rate"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hourly_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hourly Rate *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="Enter hourly rate"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hourly_category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="flat">Flat</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="broadcast">Broadcast</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferred_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Crew Member *</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={crewLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select crew member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      {sortedCrew.map((member) => (
                        <SelectItem
                          key={member.id}
                          value={member.id}
                          className="cursor-pointer"
                        >
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Role
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}