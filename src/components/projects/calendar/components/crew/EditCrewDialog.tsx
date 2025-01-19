import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSyncCrewStatus } from "@/hooks/useSyncCrewStatus";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useCrew } from "@/hooks/useCrew";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCrewSort } from "@/components/crew/useCrewSort";
import { format } from "date-fns";
import { CalendarEvent } from "@/types/events";

interface EditCrewDialogProps {
  event: CalendarEvent;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCrewDialog({ event, projectName, open, onOpenChange }: EditCrewDialogProps) {
  const { roles = [] } = useSyncCrewStatus(event);
  const { crew = [] } = useCrew();
  const { sortCrew } = useCrewSort();
  const [isPending, setIsPending] = useState(false);
  const queryClient = useQueryClient();

  const sortedCrew = sortCrew(crew);

  // Effect to auto-assign preferred crew members on first open
  useEffect(() => {
    if (open) {
      const autoAssignPreferredMembers = async () => {
        try {
          // Get project roles with preferred members
          const { data: projectRoles } = await supabase
            .from('project_roles')
            .select(`
              role_id,
              preferred_id
            `)
            .eq('project_id', event.project_id)
            .not('preferred_id', 'is', null);

          if (!projectRoles?.length) return;

          // For each unassigned role that has a preferred member, assign them
          for (const role of roles) {
            if (!role.assigned) {
              const projectRole = projectRoles.find(pr => pr.role_id === role.id);
              if (projectRole?.preferred_id) {
                await handleAssignCrew(role.id, projectRole.preferred_id);
              }
            }
          }
        } catch (error) {
          console.error("Error auto-assigning preferred members:", error);
        }
      };

      autoAssignPreferredMembers();
    }
  }, [open, event.project_id, roles]);

  const handleAssignCrew = async (roleId: string, crewMemberId: string | null) => {
    setIsPending(true);
    try {
      const { error } = await supabase
        .from('project_event_roles')
        .update({ crew_member_id: crewMemberId })
        .eq('event_id', event.id)
        .eq('role_id', roleId);

      if (error) throw error;

      await queryClient.invalidateQueries({ 
        queryKey: ['events', event.project_id]
      });

      toast.success("Crew member assigned successfully");
    } catch (error: any) {
      console.error("Error assigning crew member:", error);
      toast.error(error.message || "Failed to assign crew member");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Crew Assignments</DialogTitle>
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            <p>{projectName}</p>
            <p>{event.name}</p>
            <p>{format(event.date, 'dd.MM.yy')}</p>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4 py-4">
            {roles.map(role => (
              <div key={role.id} className="flex items-center gap-4">
                <div 
                  className="w-24 px-2 py-1 rounded text-sm text-white text-center"
                  style={{ backgroundColor: role.color }}
                >
                  {role.name}
                </div>
                <Select
                  key={`${role.id}-${role.assigned?.id || '_none'}`}
                  defaultValue={role.assigned?.id || "_none"}
                  onValueChange={(value) => handleAssignCrew(role.id, value === "_none" ? null : value)}
                  disabled={isPending}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {sortedCrew.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}