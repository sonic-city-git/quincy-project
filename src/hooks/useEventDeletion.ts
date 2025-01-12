import { supabase } from "@/integrations/supabase/client";
import { CalendarEvent } from "@/types/events";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useEventDeletion = (projectId?: string) => {
  const queryClient = useQueryClient();

  const deleteEvent = async (event: CalendarEvent) => {
    if (!projectId) return;

    try {
      // Delete equipment records
      const equipmentResult = await supabase
        .from('project_event_equipment')
        .delete()
        .match({ event_id: event.id });
        
      if (equipmentResult.error) {
        console.error('Error deleting event equipment:', equipmentResult.error);
        throw new Error(`Failed to delete equipment: ${equipmentResult.error.message}`);
      }

      // Delete role records
      const rolesResult = await supabase
        .from('project_event_roles')
        .delete()
        .match({ event_id: event.id });
        
      if (rolesResult.error) {
        console.error('Error deleting event roles:', rolesResult.error);
        throw new Error(`Failed to delete roles: ${rolesResult.error.message}`);
      }

      // Delete the event
      const eventResult = await supabase
        .from('project_events')
        .delete()
        .match({ id: event.id });
        
      if (eventResult.error) {
        console.error('Error deleting event:', eventResult.error);
        throw new Error(`Failed to delete event: ${eventResult.error.message}`);
      }

      // Invalidate queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['calendar-events', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['project-event-equipment', event.id] }),
        queryClient.invalidateQueries({ queryKey: ['project-event-roles', event.id] })
      ]);

      toast("Event Deleted", {
        description: "The event has been successfully deleted"
      });

      return true;
    } catch (error) {
      console.error('Error in deleteEvent:', error);
      toast("Error", {
        description: error instanceof Error ? error.message : "Failed to delete event",
        style: { background: 'red', color: 'white' }
      });
      return false;
    }
  };

  return { deleteEvent };
};