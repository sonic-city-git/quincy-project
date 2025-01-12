import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarEvent } from "@/types/events";

export function useSyncCrew() {
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  const handleSyncCrew = async (events: CalendarEvent[]) => {
    try {
      setIsSyncing(true);
      // Get all events that need crew in this section
      const eventsNeedingCrew = events.filter(event => event.type.needs_crew);
      
      if (eventsNeedingCrew.length === 0) {
        toast.info('No events in this section need crew');
        return;
      }

      // For each event, sync the crew roles from the project
      for (const event of eventsNeedingCrew) {
        const { data: projectRoles } = await supabase
          .from('project_roles')
          .select('*')
          .eq('project_id', event.project_id);

        if (projectRoles && projectRoles.length > 0) {
          // Delete existing event roles
          await supabase
            .from('project_event_roles')
            .delete()
            .eq('event_id', event.id);

          // Create new event roles based on project roles
          const eventRoles = projectRoles.map(role => ({
            project_id: event.project_id,
            event_id: event.id,
            role_id: role.role_id,
            daily_rate: role.daily_rate,
            hourly_rate: role.hourly_rate
          }));

          await supabase
            .from('project_event_roles')
            .upsert(eventRoles);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['project-event-roles'] });
      toast.success('Crew roles synchronized successfully');
    } catch (error) {
      console.error('Error syncing crew:', error);
      toast.error('Failed to sync crew roles');
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isSyncing,
    handleSyncCrew
  };
}