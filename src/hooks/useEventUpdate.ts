import { CalendarEvent } from "@/types/events";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useEventUpdate(projectId?: string) {
  const queryClient = useQueryClient();

  const updateEvent = async (updatedEvent: CalendarEvent) => {
    if (!projectId) return;

    try {
      const { error } = await supabase
        .from('project_events')
        .update({ 
          name: updatedEvent.name,
          event_type_id: updatedEvent.type.id,
          status: updatedEvent.status,
          location: updatedEvent.location
        })
        .eq('id', updatedEvent.id);

      if (error) throw error;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['calendar-events', projectId] })
      ]);

      toast("Event Updated", {
        description: "The event has been successfully updated"
      });
    } catch (error) {
      console.error('Error updating event:', error);
      toast("Error", {
        description: "Failed to update event",
        style: { background: 'red', color: 'white' }
      });
    }
  };

  return { updateEvent };
}