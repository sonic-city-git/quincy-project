import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalendarEvent } from "@/types/events";

export function useSyncCrewStatus(event: CalendarEvent) {
  const { data, isLoading: isChecking } = useQuery({
    queryKey: ['crew-sync-status', event.id],
    queryFn: async () => {
      // First get all project roles
      const { data: projectRoles } = await supabase
        .from('project_roles')
        .select(`
          id,
          role:crew_roles (
            id,
            name,
            color
          )
        `)
        .eq('project_id', event.project_id);

      if (!projectRoles?.length) {
        return { hasProjectRoles: false, roles: [], isSynced: false };
      }

      // Then get event role assignments
      const { data: eventRoles } = await supabase
        .from('project_event_roles')
        .select(`
          role_id,
          crew_member:crew_members (
            id,
            name
          )
        `)
        .eq('event_id', event.id);

      // Map roles with their assignments
      const roles = projectRoles.map(pr => {
        const eventRole = eventRoles?.find(er => er.role_id === pr.role.id);
        return {
          id: pr.role.id,
          name: pr.role.name,
          color: pr.role.color,
          assigned: eventRole?.crew_member || null
        };
      });

      // Check if all roles have assignments
      const isSynced = roles.every(role => role.assigned !== null);

      return {
        hasProjectRoles: true,
        roles,
        isSynced
      };
    },
    enabled: !!event.id && !!event.project_id
  });

  return {
    hasProjectRoles: data?.hasProjectRoles || false,
    roles: data?.roles || [],
    isSynced: data?.isSynced || false,
    isChecking
  };
}