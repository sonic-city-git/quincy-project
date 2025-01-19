import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalendarEvent } from "@/types/events";

export function useSyncCrewStatus(event: CalendarEvent) {
  const { data: syncStatus, isLoading: isChecking } = useQuery({
    queryKey: ['crew-sync-status', event.id],
    queryFn: async () => {
      // First check if project has any roles
      const { data: projectRoles } = await supabase
        .from('project_roles')
        .select('id')
        .eq('project_id', event.project_id);

      if (!projectRoles || projectRoles.length === 0) {
        return { hasProjectRoles: false };
      }

      // Then check if all roles are assigned to crew members
      const { data: eventRoles } = await supabase
        .from('project_event_roles')
        .select(`
          id,
          crew_member_id
        `)
        .eq('event_id', event.id);

      if (!eventRoles) {
        return { 
          hasProjectRoles: true,
          isSynced: false 
        };
      }

      const allRolesAssigned = eventRoles.every(role => role.crew_member_id);

      return {
        hasProjectRoles: true,
        isSynced: allRolesAssigned
      };
    }
  });

  return {
    hasProjectRoles: syncStatus?.hasProjectRoles ?? false,
    isSynced: syncStatus?.isSynced ?? false,
    isChecking
  };
}