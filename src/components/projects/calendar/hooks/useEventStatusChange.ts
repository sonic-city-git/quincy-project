import { CalendarEvent } from "@/types/events";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useEventStatusChange(projectId?: string) {
  const queryClient = useQueryClient();

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

      toast.success(`Event status changed to ${newStatus}`);

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