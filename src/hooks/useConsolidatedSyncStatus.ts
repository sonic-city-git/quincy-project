/**
 * CONSOLIDATED SYNC STATUS OPTIMIZATION
 * 
 * Provides efficient sync status checking for project components by consolidating
 * multiple database queries and real-time subscriptions into a single optimized hook.
 * 
 * Benefits:
 * - Single query for all sync status needs
 * - Shared cache across components  
 * - Consolidated real-time subscriptions
 * - Batch processing for multiple events
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalendarEvent } from "@/types/events";
import { useEffect, useMemo } from "react";

interface ProjectSyncData {
  equipment: Array<{
    equipment_id: string;
    quantity: number;
  }>;
  eventEquipment: Map<string, Array<{
    equipment_id: string;
    quantity: number;
    is_synced: boolean;
  }>>;
  eventRoles: Map<string, Array<{
    role_id: string;
    crew_member_id: string | null;
  }>>;
  projectRoles: Array<{
    id: string;
    role: {
      id: string;
      name: string;
      color: string;
    };
  }>;
}

interface SyncStatusResult {
  isEquipmentSynced: boolean;
  isCrewSynced: boolean;
  hasProjectEquipment: boolean;
  hasProjectRoles: boolean;
  roles: Array<{
    id: string;
    name: string;
    color: string;
    assigned: any | null;
  }>;
}

/**
 * CONSOLIDATED PROJECT SYNC HOOK
 * 
 * Fetches all sync-related data for a project in a single optimized query.
 * Provides data for multiple components to avoid duplicate queries.
 */
export function useConsolidatedProjectSync(projectId: string) {
  const queryClient = useQueryClient();

  const { data: projectSyncData, isLoading } = useQuery({
    queryKey: ['project-sync-data', projectId],
    queryFn: async (): Promise<ProjectSyncData> => {
      if (!projectId) {
        return {
          equipment: [],
          eventEquipment: new Map(),
          eventRoles: new Map(),
          projectRoles: []
        };
      }

      // Batch all project-related queries
      const [equipmentResult, eventsResult, rolesResult] = await Promise.all([
        // Get project equipment
        supabase
          .from('project_equipment')
          .select('equipment_id, quantity')
          .eq('project_id', projectId),

        // Get events for this project (for equipment and roles)
        supabase
          .from('project_events')
          .select(`
            id,
            project_event_equipment (
              equipment_id,
              quantity,
              is_synced
            ),
            project_event_roles (
              role_id,
              crew_member_id
            )
          `)
          .eq('project_id', projectId),

        // Get project roles (ALL variants - we'll filter by variant in the logic)
        supabase
          .from('project_roles')
          .select(`
            id,
            variant_id,
            role:crew_roles (
              id,
              name,
              color
            )
          `)
          .eq('project_id', projectId)
      ]);

      if (equipmentResult.error) throw equipmentResult.error;
      if (eventsResult.error) throw eventsResult.error;
      if (rolesResult.error) throw rolesResult.error;

      // Process event equipment into maps for fast lookup
      const eventEquipment = new Map<string, Array<any>>();
      const eventRoles = new Map<string, Array<any>>();

      eventsResult.data?.forEach(event => {
        eventEquipment.set(event.id, event.project_event_equipment || []);
        eventRoles.set(event.id, event.project_event_roles || []);
      });

      return {
        equipment: equipmentResult.data || [],
        eventEquipment,
        eventRoles,
        projectRoles: rolesResult.data || []
      };
    },
    enabled: !!projectId,
    staleTime: 30 * 1000, // 30 seconds - sync status doesn't change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Set up consolidated real-time subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project-sync-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_equipment',
        filter: `project_id=eq.${projectId}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['project-sync-data', projectId] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_event_equipment'
      }, (payload) => {
        // Only invalidate if this affects our project
        queryClient.invalidateQueries({ queryKey: ['project-sync-data', projectId] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_event_roles'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['project-sync-data', projectId] });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [projectId, queryClient]);

  return {
    projectSyncData,
    isLoading
  };
}

/**
 * OPTIMIZED EVENT SYNC STATUS
 * 
 * Fast sync status for individual events using consolidated project data.
 * Replaces the individual useSyncStatus hook with O(1) lookup.
 */
export function useEventSyncStatus(event: CalendarEvent | null): SyncStatusResult {
  const { projectSyncData, isLoading } = useConsolidatedProjectSync(event?.project_id || '');

  return useMemo(() => {
    if (isLoading || !event || !projectSyncData) {
      return {
        isEquipmentSynced: false,
        isCrewSynced: false,
        hasProjectEquipment: false,
        hasProjectRoles: false,
        roles: []
      };
    }

    const { equipment, eventEquipment, eventRoles, projectRoles } = projectSyncData;

    // Equipment sync status
    let equipmentSynced = true;
    const hasProjectEquipment = equipment.length > 0;

    if (hasProjectEquipment && event.type?.needs_equipment) {
      const eventEq = eventEquipment.get(event.id) || [];
      
      if (eventEq.length === 0) {
        equipmentSynced = false;
      } else {
        // Check if all project equipment is synced in event
        const eventEqMap = new Map(eventEq.map(eq => [eq.equipment_id, eq.is_synced]));
        equipmentSynced = equipment.every(projEq => 
          eventEqMap.get(projEq.equipment_id) === true
        );
      }
    }

    // Crew sync status - filter roles by event's variant
    const eventVariantId = event.variant_id;
    const variantProjectRoles = projectRoles.filter(pr => pr.variant_id === eventVariantId);
    const hasProjectRoles = variantProjectRoles.length > 0;
    const eventRolesList = eventRoles.get(event.id) || [];
    
    // Debug logging for orphan detection
    if (event.variant_name && variantProjectRoles.length === 0 && projectRoles.length > 0) {
      console.log(`⚠️ Potential orphan: Event ${event.id} has variant_id ${eventVariantId} but no matching project roles`);
      console.log(`Available project role variant_ids:`, projectRoles.map(pr => pr.variant_id));
      console.log(`Event variant_name: ${event.variant_name}`);
    }
    
    const roles = variantProjectRoles.map(pr => {
      const eventRole = eventRolesList.find(er => er.role_id === pr.role.id);
      return {
        id: pr.role.id,
        name: pr.role.name,
        color: pr.role.color,
        assigned: eventRole?.crew_member_id ? { id: eventRole.crew_member_id } : null
      };
    });

    const crewSynced = !hasProjectRoles || roles.every(role => role.assigned !== null);

    return {
      isEquipmentSynced: equipmentSynced,
      isCrewSynced: crewSynced,
      hasProjectEquipment,
      hasProjectRoles,
      roles
    };
  }, [projectSyncData, event, isLoading]);
}

/**
 * OPTIMIZED SECTION SYNC STATUS
 * 
 * Fast sync status for multiple events using consolidated project data.
 * Replaces the individual useSectionSyncStatus hook.
 */
export function useSectionSyncStatus(events: CalendarEvent[]) {
  const projectId = events[0]?.project_id;
  const { projectSyncData, isLoading } = useConsolidatedProjectSync(projectId || '');

  return useMemo(() => {
    if (isLoading || !projectSyncData || events.length === 0) {
      return 'no-equipment';
    }

    const eventsWithEquipment = events.filter(event => event.type.needs_equipment);
    
    if (eventsWithEquipment.length === 0) {
      return 'no-equipment';
    }

    // Check if any event is not synced
    const hasUnsynced = eventsWithEquipment.some(event => {
      const eventEq = projectSyncData.eventEquipment.get(event.id) || [];
      
      if (eventEq.length === 0) return true; // No equipment = not synced
      
      return !eventEq.every(eq => eq.is_synced); // Has unsynced equipment
    });

    return hasUnsynced ? 'not-synced' : 'synced';
  }, [projectSyncData, events, isLoading]);
}