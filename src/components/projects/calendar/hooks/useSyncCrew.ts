
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
          .select(`
            *,
            crew_roles (
              id,
              name,
              color
            )
          `)
          .eq('project_id', event.project_id);

        if (projectRoles && projectRoles.length > 0) {
          // Check existing event roles to avoid duplicates
          const { data: existingRoles } = await supabase
            .from('project_event_roles')
            .select('role_id')
            .eq('event_id', event.id);

          const existingRoleIds = new Set(existingRoles?.map(r => r.role_id) || []);

          // Only create roles that don't already exist
          const rolesToCreate = projectRoles.filter(role => !existingRoleIds.has(role.role_id));

          if (rolesToCreate.length > 0) {
            // Create new event roles based on project roles with proper rates
            const eventRoles = rolesToCreate.map(role => ({
              project_id: event.project_id,
              event_id: event.id,
              role_id: role.role_id,
              crew_member_id: role.preferred_id,
              daily_rate: role.daily_rate,
              hourly_rate: role.hourly_rate,
              hourly_category: role.hourly_category || 'flat',
              hours_worked: null,
              // Set total_cost to daily_rate for immediate calculation
              total_cost: role.daily_rate || null
            }));

            const { error: insertError } = await supabase
              .from('project_event_roles')
              .insert(eventRoles);

            if (insertError) {
              console.error('Error inserting event roles:', insertError);
              throw insertError;
            }
          }

          // Update existing roles with current project role rates
          for (const existingRoleId of existingRoleIds) {
            const projectRole = projectRoles.find(pr => pr.role_id === existingRoleId);
            if (projectRole) {
              await supabase
                .from('project_event_roles')
                .update({
                  daily_rate: projectRole.daily_rate,
                  hourly_rate: projectRole.hourly_rate,
                  hourly_category: projectRole.hourly_category || 'flat',
                  total_cost: projectRole.daily_rate || null
                })
                .eq('event_id', event.id)
                .eq('role_id', existingRoleId);
            }
          }
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['project-event-roles'] });
      await queryClient.invalidateQueries({ queryKey: ['events'] });
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
