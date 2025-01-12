import { CalendarEvent } from "@/types/events";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function useEventStatusChange(projectId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleStatusChange = async (event: CalendarEvent, newStatus: CalendarEvent['status']) => {
    if (!projectId) return;

    const queryKeysToUpdate = [
      ['events', projectId],
      ['calendar-events', projectId]
    ];

    try {
      const updatedEvent = { ...event, status: newStatus };
      
      // Update all relevant caches optimistically
      queryKeysToUpdate.forEach(queryKey => {
        queryClient.setQueryData(queryKey, (oldData: CalendarEvent[] | undefined) => {
          if (!oldData) return [updatedEvent];
          return oldData.map(e => 
            e.id === event.id ? updatedEvent : e
          );
        });
      });

      const { error } = await supabase
        .from('project_events')
        .update({ status: newStatus })
        .eq('id', event.id)
        .eq('project_id', projectId);

      if (error) throw error;

      const { dismiss } = toast({
        title: "Status Updated",
        description: `Event status changed to ${newStatus}`,
      });

      setTimeout(() => {
        dismiss();
      }, 600);

      await Promise.all(
        queryKeysToUpdate.map(queryKey =>
          queryClient.invalidateQueries({ queryKey })
        )
      );

    } catch (error) {
      console.error('Error updating event status:', error);
      
      queryKeysToUpdate.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      
      toast({
        title: "Error",
        description: "Failed to update event status",
        variant: "destructive",
      });
    }
  };

  return { handleStatusChange };
}