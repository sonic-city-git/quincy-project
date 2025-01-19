import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSyncCrewStatus } from "@/hooks/useSyncCrewStatus";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useCrew } from "@/hooks/useCrew";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { CalendarEvent } from "@/types/events";
import { CrewMemberSelectContent } from "@/components/crew/CrewMemberSelectContent";

interface EditCrewDialogProps {
  event: CalendarEvent;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCrewDialog({ event, projectName, open, onOpenChange }: EditCrewDialogProps) {
  const { roles = [] } = useSyncCrewStatus(event);
  const { crew = [] } = useCrew();
  const [isPending, setIsPending] = useState(false);
  const [assignments, setAssignments] = useState<Record<string, string | null>>({});
  const queryClient = useQueryClient();

  // Initialize assignments when roles change or dialog opens
  useEffect(() => {
    if (open) {
      const initialAssignments = roles.reduce((acc, role) => {
        acc[role.id] = role.assigned?.id || null;
        return acc;
      }, {} as Record<string, string | null>);
      setAssignments(initialAssignments);
    }
  }, [roles, open]);

  const handleAssignCrew = async (roleId: string, crewMemberId: string | null) => {
    setIsPending(true);
    try {
      if (!crewMemberId) {
        // Delete the role assignment if "None" is selected
        const { error } = await supabase
          .from('project_event_roles')
          .delete()
          .match({
            project_id: event.project_id,
            event_id: event.id,
            role_id: roleId
          });

        if (error) throw error;
      } else {
        // Update or insert the role assignment
        const { error } = await supabase
          .from('project_event_roles')
          .upsert({
            project_id: event.project_id,
            event_id: event.id,
            role_id: roleId,
            crew_member_id: crewMemberId
          });

        if (error) throw error;
      }

      // Update local state after successful database operation
      setAssignments(prev => ({
        ...prev,
        [roleId]: crewMemberId
      }));

      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['events', event.project_id]
        }),
        queryClient.invalidateQueries({
          queryKey: ['crew-sync-status', event.id]
        })
      ]);

      toast.success("Crew member assignment updated");
    } catch (error: any) {
      console.error("Error assigning crew member:", error);
      toast.error(error.message || "Failed to assign crew member");
      
      // Revert the local state on error
      setAssignments(prev => ({
        ...prev,
        [roleId]: roles.find(r => r.id === roleId)?.assigned?.id || null
      }));
    } finally {
      setIsPending(false);
    }
  };

  const handleClose = async () => {
    // Ensure all queries are invalidated when dialog closes
    await Promise.all([
      queryClient.invalidateQueries({ 
        queryKey: ['events', event.project_id]
      }),
      queryClient.invalidateQueries({
        queryKey: ['crew-sync-status', event.id]
      })
    ]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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
                  value={assignments[role.id] || "_none"}
                  onValueChange={(value) => handleAssignCrew(role.id, value === "_none" ? null : value)}
                  disabled={isPending}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <CrewMemberSelectContent crew={crew} showNoneOption />
                </Select>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end">
          <Button onClick={handleClose} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}