import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCrewRoles } from "@/hooks/useCrewRoles";
import { Project } from "@/types/projects";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCrew } from "@/hooks/useCrew";
import { useCrewSort } from "@/components/crew/useCrewSort";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQueryClient } from "@tanstack/react-query";

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

export function AddRoleDialog({ isOpen, onClose, project }: AddRoleDialogProps) {
  const { roles } = useCrewRoles();
  const { crew } = useCrew();
  const { sortCrew } = useCrewSort();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    defaultValues: {
      daily_rate: 7500,
      hourly_rate: 850
    }
  });

  const sortedCrew = sortCrew(crew || []);

  const onSubmit = async (data: FormData) => {
    try {
      console.log('Starting to add role:', data);
      
      // Add the project role
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

      // Invalidate queries
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['project-roles', project.id] 
        }),
        queryClient.invalidateQueries({
          queryKey: ['project-event-roles']
        }),
        queryClient.invalidateQueries({
          queryKey: ['crew-sync-status']
        })
      ]);

      toast.success('Role added successfully');
      onClose();
    } catch (error) {
      console.error('Error adding role:', error);
      toast.error('Failed to add role');
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
            <Select
              value={watch('preferred_id') || ''}
              onValueChange={(value) => setValue('preferred_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select preferred crew member" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-[200px]">
                  {sortedCrew.map((member) => {
                    const initials = member.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase();

                    return (
                      <SelectItem 
                        key={member.id} 
                        value={member.id}
                        className="flex items-center gap-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {member.avatar_url ? (
                              <AvatarImage 
                                src={member.avatar_url} 
                                alt={member.name} 
                                className="object-cover"
                              />
                            ) : (
                              <AvatarFallback className="text-xs bg-zinc-800 text-zinc-400">
                                {initials}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span className="truncate">{member.name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </ScrollArea>
              </SelectContent>
            </Select>
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