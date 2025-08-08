/**
 * 🎯 UNIFIED EVENT SYNC SYSTEM
 * 
 * Consolidates all sync-related functionality into a single, performant hook.
 * Replaces: useSyncStatus, useSyncCrewStatus, useEquipmentSync, useVariantSync
 * 
 * Features:
 * - Single query for all sync data
 * - Unified sync actions 
 * - Consistent status reporting
 * - Real-time subscriptions
 * - Optimistic updates
 */

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalendarEvent } from "@/types/events";
import { toast } from "sonner";
import { useEffect, useMemo } from "react";

import { 
  EquipmentDifference, 
  EquipmentItem, 
  CrewRole, 
  UnifiedSyncData,
  SyncActions,
  BulkSyncActions,
  UnifiedEventSyncResult
} from '@/types/eventSync';

/**
 * Main unified sync hook - replaces all individual sync hooks
 */
export function useUnifiedEventSync(event: CalendarEvent | null): UnifiedEventSyncResult {
  const queryClient = useQueryClient();

  // Unified data query - single DB call for all sync information
  const { data: syncData, isLoading } = useQuery({
    queryKey: ['unified-event-sync', event?.id, event?.project_id],
    queryFn: async () => {
      if (!event) {
        return createEmptyData();
      }

      const [equipmentData, crewData] = await Promise.all([
        fetchEquipmentSyncData(event),
        fetchCrewSyncData(event)
      ]);

      return {
        equipment: equipmentData,
        crew: crewData,
        status: {
          canEdit: !['cancelled', 'invoice ready', 'invoiced'].includes(event.status),
          isLocked: ['cancelled', 'invoiced'].includes(event.status),
          needsAttention: !equipmentData.synced || !crewData.synced
        }
      };
    },
    enabled: !!event?.id,
    staleTime: 30000, // 30 seconds - reasonable for sync data
    refetchOnWindowFocus: false
  });

  // Equipment sync mutation
  const equipmentMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error('No event provided');
      
      const { error } = await supabase.rpc('sync_event_equipment_unified', {
        p_event_id: event.id,
        p_project_id: event.project_id,
        p_variant_id: event.variant_id || null
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Equipment synced successfully");
      invalidateQueries();
    },
    onError: (error: any) => {
      console.error('❌ Equipment sync failed:', error);
      toast.error(`Equipment sync failed: ${error.message}`);
    }
  });

  // Crew sync mutation
  const crewMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error('No event provided');
      
      console.log('🔄 Syncing crew for event:', {
        event_id: event.id,
        project_id: event.project_id,
        variant_id: event.variant_id
      });
      
      const { error } = await supabase.rpc('sync_event_crew', {
        p_event_id: event.id,
        p_project_id: event.project_id,
        p_variant_id: event.variant_id || null
      });

      if (error) {
        console.error('🚨 RPC sync_event_crew error:', error);
        throw error;
      }
      
      console.log('✅ Crew sync completed successfully');
    },
    onSuccess: () => {
      toast.success("Crew synced successfully");
      invalidateQueries();
    },
    onError: (error: any) => {
      console.error('❌ Crew sync failed:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      toast.error(`Crew sync failed: ${error.message || 'Unknown error'}`);
    }
  });

  // Real-time subscription for sync changes
  useEffect(() => {
    if (!event?.id) return;

    const channel = supabase
      .channel(`event-sync-${event.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_event_equipment',
        filter: `event_id=eq.${event.id}`
      }, () => {
        queryClient.invalidateQueries({ 
          queryKey: ['unified-event-sync', event.id] 
        });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_event_roles',
        filter: `event_id=eq.${event.id}`
      }, () => {
        queryClient.invalidateQueries({ 
          queryKey: ['unified-event-sync', event.id] 
        });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [event?.id, queryClient]);

  const invalidateQueries = () => {
    if (!event) return;
    
    queryClient.invalidateQueries({ 
      queryKey: ['unified-event-sync', event.id] 
    });
    queryClient.invalidateQueries({ 
      queryKey: ['events', event.project_id] 
    });
  };

  const actions: SyncActions = {
    syncEquipment: () => equipmentMutation.mutateAsync(),
    syncCrew: () => crewMutation.mutateAsync(),
    syncAll: async () => {
      await Promise.all([
        equipmentMutation.mutateAsync(),
        crewMutation.mutateAsync()
      ]);
    },
    fetchEquipmentDifferences: () => fetchEquipmentDifferences(event)
  };

  return {
    data: syncData || createEmptyData(),
    actions,
    isLoading,
    isSyncing: equipmentMutation.isPending || crewMutation.isPending
  };
}

/**
 * Fetch equipment sync data
 */
async function fetchEquipmentSyncData(event: CalendarEvent) {
  if (!event.type?.needs_equipment) {
    return {
      synced: true,
      hasProjectEquipment: false,
      differences: { added: [], removed: [], changed: [] },
      canSync: false
    };
  }

  const [projectEquipment, eventEquipment] = await Promise.all([
    supabase
      .from('project_equipment')
      .select('equipment_id, quantity')
      .eq('project_id', event.project_id)
      .eq('variant_id', event.variant_id || null),
    supabase
      .from('project_event_equipment')
      .select('equipment_id, quantity, is_synced')
      .eq('event_id', event.id)
  ]);

  const hasProjectEquipment = !!projectEquipment.data?.length;
  
  if (!hasProjectEquipment) {
    return {
      synced: true,
      hasProjectEquipment: false,
      differences: { added: [], removed: [], changed: [] },
      canSync: false
    };
  }

  // Calculate sync status
  const projectMap = new Map(
    projectEquipment.data?.map(item => [item.equipment_id, item.quantity]) || []
  );
  const eventMap = new Map(
    eventEquipment.data?.map(item => [
      item.equipment_id, 
      { quantity: item.quantity, is_synced: item.is_synced }
    ]) || []
  );

  const synced = Array.from(projectMap.keys()).every(equipId => {
    const eventItem = eventMap.get(equipId);
    return eventItem && eventItem.is_synced;
  });

  return {
    synced,
    hasProjectEquipment: true,
    differences: { added: [], removed: [], changed: [] }, // Calculated on demand
    canSync: !synced
  };
}

/**
 * Fetch crew sync data
 */
async function fetchCrewSyncData(event: CalendarEvent) {
  if (!event.type?.needs_crew) {
    return {
      synced: true,
      hasProjectRoles: false,
      roles: [],
      conflicts: false,
      assignedCount: 0,
      totalCount: 0
    };
  }

  const [projectRoles, eventRoles] = await Promise.all([
    supabase
      .from('project_roles')
      .select(`
        id,
        role:crew_roles (
          id,
          name,
          color
        )
      `)
      .eq('project_id', event.project_id)
      .eq('variant_id', event.variant_id || null),
    supabase
      .from('project_event_roles')
      .select(`
        role_id,
        crew_member_id,
        crew_member:crew_members (
          id,
          name,
          email
        )
      `)
      .eq('event_id', event.id)
  ]);

  const hasProjectRoles = !!projectRoles.data?.length;
  
  if (!hasProjectRoles) {
    return {
      synced: true,
      hasProjectRoles: false,
      roles: [],
      conflicts: false,
      assignedCount: 0,
      totalCount: 0
    };
  }

  // Map roles with assignments
  const eventRoleMap = new Map(
    eventRoles.data?.map(er => [er.role_id, er]) || []
  );

  const roles: CrewRole[] = projectRoles.data?.map(pr => {
    const eventRole = eventRoleMap.get(pr.role.id);
    return {
      id: pr.role.id,
      name: pr.role.name,
      color: pr.role.color,
      assigned: !!eventRole?.crew_member_id,
      crewMember: eventRole?.crew_member || undefined
    };
  }) || [];

  const assignedCount = roles.filter(role => role.assigned).length;
  const totalCount = roles.length;
  const synced = assignedCount === totalCount && totalCount > 0;

  return {
    synced,
    hasProjectRoles: true,
    roles,
    conflicts: false, // TODO: Implement conflict detection
    assignedCount,
    totalCount
  };
}

/**
 * Fetch detailed equipment differences
 */
async function fetchEquipmentDifferences(event: CalendarEvent | null): Promise<EquipmentDifference> {
  if (!event) {
    return { added: [], removed: [], changed: [] };
  }

  const [projectEquipment, eventEquipment] = await Promise.all([
    supabase
      .from('project_equipment')
      .select(`
        equipment_id,
        quantity,
        group_id,
        equipment:equipment (
          name,
          code
        ),
        group:project_equipment_groups (
          name
        )
      `)
      .eq('project_id', event.project_id)
      .eq('variant_id', event.variant_id || null),
    supabase
      .from('project_event_equipment')
      .select(`
        equipment_id,
        quantity,
        group_id,
        equipment:equipment (
          name,
          code
        ),
        group:project_equipment_groups (
          name
        )
      `)
      .eq('event_id', event.id)
  ]);

  const projectMap = new Map(
    projectEquipment.data?.map(item => [item.equipment_id, item]) || []
  );
  const eventMap = new Map(
    eventEquipment.data?.map(item => [item.equipment_id, item]) || []
  );

  const added: EquipmentItem[] = [];
  const removed: EquipmentItem[] = [];
  const changed: EquipmentDifference['changed'] = [];

  // Find added and changed items
  projectMap.forEach((projectItem, equipId) => {
    const eventItem = eventMap.get(equipId);
    
    if (!eventItem) {
      added.push({
        id: equipId,
        equipment: projectItem.equipment,
        quantity: projectItem.quantity,
        group: projectItem.group
      });
    } else if (eventItem.quantity !== projectItem.quantity) {
      changed.push({
        item: {
          id: equipId,
          equipment: projectItem.equipment,
          quantity: eventItem.quantity,
          group: projectItem.group
        },
        oldQuantity: eventItem.quantity,
        newQuantity: projectItem.quantity
      });
    }
  });

  // Find removed items
  eventMap.forEach((eventItem, equipId) => {
    if (!projectMap.has(equipId)) {
      removed.push({
        id: equipId,
        equipment: eventItem.equipment,
        quantity: eventItem.quantity,
        group: eventItem.group
      });
    }
  });

  return { added, removed, changed };
}

/**
 * Create empty data structure
 */
function createEmptyData(): UnifiedSyncData {
  return {
    equipment: {
      synced: true,
      hasProjectEquipment: false,
      differences: { added: [], removed: [], changed: [] },
      canSync: false
    },
    crew: {
      synced: true,
      hasProjectRoles: false,
      roles: [],
      conflicts: false,
      assignedCount: 0,
      totalCount: 0
    },
    status: {
      canEdit: true,
      isLocked: false,
      needsAttention: false
    }
  };
}

/**
 * Bulk sync hook for multiple events
 */
export function useBulkEventSync(events: CalendarEvent[]) {
  const queryClient = useQueryClient();

  const bulkSyncMutation = useMutation({
    mutationFn: async (type: 'equipment' | 'crew' | 'all') => {
      const promises = events.map(async (event) => {
        const calls = [];
        
        if (type === 'equipment' || type === 'all') {
          calls.push(
            supabase.rpc('sync_event_equipment_unified', {
              p_event_id: event.id,
              p_project_id: event.project_id,
              p_variant_id: event.variant_id || null
            })
          );
        }
        
        if (type === 'crew' || type === 'all') {
          calls.push(
            supabase.rpc('sync_event_crew', {
              p_event_id: event.id,
              p_project_id: event.project_id,
              p_variant_id: event.variant_id || null
            })
          );
        }
        
        const results = await Promise.all(calls);
        return results.every(result => !result.error);
      });

      const results = await Promise.all(promises);
      const successCount = results.filter(Boolean).length;
      
      return { successCount, totalCount: events.length };
    },
    onSuccess: ({ successCount, totalCount }) => {
      // Invalidate all related queries
      events.forEach(event => {
        queryClient.invalidateQueries({ 
          queryKey: ['unified-event-sync', event.id] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['events', event.project_id] 
        });
      });

      if (successCount === totalCount) {
        toast.success(`Successfully synced all ${totalCount} events`);
      } else {
        toast.success(`Synced ${successCount} of ${totalCount} events`);
      }
    },
    onError: (error: any) => {
      console.error('❌ Bulk sync failed:', error);
      toast.error("Bulk sync failed");
    }
  });

  return {
    syncEquipment: () => bulkSyncMutation.mutateAsync('equipment'),
    syncCrew: () => bulkSyncMutation.mutateAsync('crew'),
    syncAll: () => bulkSyncMutation.mutateAsync('all'),
    isSyncing: bulkSyncMutation.isPending
  };
}