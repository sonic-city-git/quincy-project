import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchEvents } from "@/utils/eventQueries";
import { CalendarEvent } from "@/types/events";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useProjectEvents(projectId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['events', projectId],
    queryFn: () => fetchEvents(projectId),
    enabled: !!projectId
  });

  const handleStatusChange = async (event: CalendarEvent, newStatus: CalendarEvent['status']) => {
    if (!projectId) return;

    const queryKeysToUpdate = [
      ['events', projectId],
      ['calendar-events', projectId]
    ];

    try {
      const updatedEvent = { ...event, status: newStatus };
      
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

  return {
    events,
    isLoading,
    refetch,
    handleStatusChange
  };
}