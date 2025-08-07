// Variant Sync Hook
// Handles syncing variant resources (crew/equipment) to project events

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  VariantSyncOptions,
  VariantSyncResult,
  VariantSyncConflict,
  VariantSyncProgress
} from '@/types/variants';

/**
 * Hook for syncing variant resources to project events
 * Handles crew role and equipment synchronization with conflict detection
 */
export function useVariantSync(projectId: string) {
  const queryClient = useQueryClient();

  // Sync variant to event mutation
  const syncVariantToEventMutation = useMutation({
    mutationFn: async (options: VariantSyncOptions): Promise<VariantSyncResult> => {
      const { eventId, variantName, onProgress } = options;
      
      const conflicts: VariantSyncConflict[] = [];
      const errors: string[] = [];
      let syncedCrewRoles = 0;
      let syncedEquipmentItems = 0;

      try {
        // Step 1: Sync crew roles
        onProgress?.({ step: 'crew', progress: 0, message: 'Syncing crew roles...' });
        
        const crewSyncResult = await syncCrewRolesToEvent(projectId, eventId, variantName);
        syncedCrewRoles = crewSyncResult.synced;
        conflicts.push(...crewSyncResult.conflicts);
        if (crewSyncResult.error) errors.push(crewSyncResult.error);

        onProgress?.({ step: 'crew', progress: 50, message: `Synced ${syncedCrewRoles} crew roles` });

        // Step 2: Sync equipment
        onProgress?.({ step: 'equipment', progress: 50, message: 'Syncing equipment...' });
        
        const equipmentSyncResult = await syncEquipmentToEvent(projectId, eventId, variantName);
        syncedEquipmentItems = equipmentSyncResult.synced;
        conflicts.push(...equipmentSyncResult.conflicts);
        if (equipmentSyncResult.error) errors.push(equipmentSyncResult.error);

        onProgress?.({ step: 'equipment', progress: 100, message: `Synced ${syncedEquipmentItems} equipment items` });

        // Step 3: Complete
        onProgress?.({ step: 'complete', progress: 100, message: 'Sync completed' });

        return {
          success: errors.length === 0,
          conflicts,
          synced_crew_roles: syncedCrewRoles,
          synced_equipment_items: syncedEquipmentItems,
          errors: errors.length > 0 ? errors : undefined
        };

      } catch (error) {
        console.error('Variant sync error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
        
        return {
          success: false,
          conflicts,
          synced_crew_roles: syncedCrewRoles,
          synced_equipment_items: syncedEquipmentItems,
          errors: [errorMessage]
        };
      }
    },
    onSuccess: (result, { variantName }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries(['project-event-roles', projectId]);
      queryClient.invalidateQueries(['project-event-equipment', projectId]);
      queryClient.invalidateQueries(['consolidated-events', projectId]);

      if (result.success) {
        toast.success(
          `Successfully synced "${variantName}" variant: ${result.synced_crew_roles} crew roles, ${result.synced_equipment_items} equipment items`
        );
      } else {
        const conflictCount = result.conflicts.length;
        const errorCount = result.errors?.length || 0;
        
        if (conflictCount > 0 || errorCount > 0) {
          toast.warning(
            `Sync completed with ${conflictCount} conflicts and ${errorCount} errors. Check sync result for details.`
          );
        } else {
          toast.error('Sync failed. Please try again.');
        }
      }
    },
    onError: (error: Error) => {
      console.error('Sync variant error:', error);
      toast.error(`Sync failed: ${error.message}`);
    }
  });

  // Bulk sync variant to multiple events
  const bulkSyncVariantMutation = useMutation({
    mutationFn: async ({
      eventIds,
      variantName,
      onProgress
    }: {
      eventIds: string[];
      variantName: string;
      onProgress?: (progress: { completed: number; total: number; currentEvent?: string }) => void;
    }): Promise<VariantSyncResult[]> => {
      const results: VariantSyncResult[] = [];
      
      for (let i = 0; i < eventIds.length; i++) {
        const eventId = eventIds[i];
        onProgress?.({ completed: i, total: eventIds.length, currentEvent: eventId });
        
        try {
          const result = await syncVariantToEventMutation.mutateAsync({
            projectId,
            eventId,
            variantName
          });
          results.push(result);
        } catch (error) {
          console.error(`Error syncing to event ${eventId}:`, error);
          results.push({
            success: false,
            conflicts: [],
            synced_crew_roles: 0,
            synced_equipment_items: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error']
          });
        }
      }

      onProgress?.({ completed: eventIds.length, total: eventIds.length });
      return results;
    },
    onSuccess: (results, { variantName, eventIds }) => {
      const successCount = results.filter(r => r.success).length;
      const totalConflicts = results.reduce((sum, r) => sum + r.conflicts.length, 0);
      const totalErrors = results.reduce((sum, r) => sum + (r.errors?.length || 0), 0);

      if (successCount === eventIds.length) {
        toast.success(`Successfully synced "${variantName}" to ${successCount} events`);
      } else {
        toast.warning(
          `Synced to ${successCount}/${eventIds.length} events with ${totalConflicts} conflicts and ${totalErrors} errors`
        );
      }
    },
    onError: (error: Error) => {
      console.error('Bulk sync error:', error);
      toast.error(`Bulk sync failed: ${error.message}`);
    }
  });

  // Remove variant sync from event
  const removeSyncMutation = useMutation({
    mutationFn: async ({ eventId }: { eventId: string }): Promise<void> => {
      // Remove crew role assignments
      const { error: crewError } = await supabase
        .from('project_event_roles')
        .delete()
        .eq('project_id', projectId)
        .eq('event_id', eventId);

      if (crewError) {
        console.error('Error removing crew assignments:', crewError);
        throw new Error(`Failed to remove crew assignments: ${crewError.message}`);
      }

      // Remove equipment assignments
      const { error: equipmentError } = await supabase
        .from('project_event_equipment')
        .delete()
        .eq('project_id', projectId)
        .eq('event_id', eventId);

      if (equipmentError) {
        console.error('Error removing equipment assignments:', equipmentError);
        throw new Error(`Failed to remove equipment assignments: ${equipmentError.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['project-event-roles', projectId]);
      queryClient.invalidateQueries(['project-event-equipment', projectId]);
      queryClient.invalidateQueries(['consolidated-events', projectId]);
      toast.success('Event sync removed successfully');
    },
    onError: (error: Error) => {
      console.error('Remove sync error:', error);
      toast.error(`Failed to remove sync: ${error.message}`);
    }
  });

  return {
    syncVariantToEvent: syncVariantToEventMutation.mutateAsync,
    bulkSyncVariant: bulkSyncVariantMutation.mutateAsync,
    removeEventSync: removeSyncMutation.mutateAsync,
    
    // Loading states
    isSyncing: syncVariantToEventMutation.isPending,
    isBulkSyncing: bulkSyncVariantMutation.isPending,
    isRemoving: removeSyncMutation.isPending
  };
}

// === HELPER FUNCTIONS ===

interface SyncResult {
  synced: number;
  conflicts: VariantSyncConflict[];
  error?: string;
}

async function syncCrewRolesToEvent(
  projectId: string,
  eventId: string,
  variantName: string
): Promise<SyncResult> {
  try {
    // First get the variant_id from the variant_name
    const { data: variant, error: variantError } = await supabase
      .from('project_variants')
      .select('id')
      .eq('project_id', projectId)
      .eq('variant_name', variantName)
      .single();

    if (variantError || !variant) {
      return { synced: 0, conflicts: [], error: `Failed to find variant: ${variantError?.message || 'Variant not found'}` };
    }

    // Get crew roles for the variant
    const { data: variantRoles, error: rolesError } = await supabase
      .from('project_roles')
      .select(`
        *,
        role:crew_roles (
          id,
          name,
          color
        )
      `)
      .eq('project_id', projectId)
      .eq('variant_id', variant.id);

    if (rolesError) {
      return { synced: 0, conflicts: [], error: `Failed to fetch variant roles: ${rolesError.message}` };
    }

    if (!variantRoles || variantRoles.length === 0) {
      return { synced: 0, conflicts: [] };
    }

    // Check for existing event role assignments
    const { data: existingRoles } = await supabase
      .from('project_event_roles')
      .select('role_id')
      .eq('project_id', projectId)
      .eq('event_id', eventId);

    const existingRoleIds = new Set(existingRoles?.map(r => r.role_id) || []);
    const conflicts: VariantSyncConflict[] = [];

    // Create new role assignments for roles that don't exist
    const rolesToCreate = variantRoles.filter(role => !existingRoleIds.has(role.role_id));

    if (rolesToCreate.length === 0) {
      return { synced: 0, conflicts: [] };
    }

    // Check for crew availability conflicts
    for (const role of rolesToCreate) {
      if (role.preferred_id) {
        const hasConflict = await checkCrewMemberAvailability(role.preferred_id, eventId);
        if (hasConflict) {
          conflicts.push({
            type: 'crew_assignment',
            resource_id: role.preferred_id,
            resource_name: role.role?.name || 'Unknown Role',
            conflict_reason: 'Crew member already assigned to another event on this date',
            suggested_resolution: 'Assign a different crew member or resolve the scheduling conflict'
          });
        }
      }
    }

    // Create the role assignments
    const roleAssignments = rolesToCreate.map(role => ({
      project_id: projectId,
      event_id: eventId,
      role_id: role.role_id,
      crew_member_id: role.preferred_id,
      daily_rate: role.daily_rate,
      hourly_rate: role.hourly_rate,
      hourly_category: role.hourly_category,
      total_cost: role.daily_rate || 0
    }));

    const { error: insertError } = await supabase
      .from('project_event_roles')
      .insert(roleAssignments);

    if (insertError) {
      return { synced: 0, conflicts, error: `Failed to create role assignments: ${insertError.message}` };
    }

    return { synced: roleAssignments.length, conflicts };

  } catch (error) {
    console.error('Error syncing crew roles:', error);
    return { 
      synced: 0, 
      conflicts: [], 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function syncEquipmentToEvent(
  projectId: string,
  eventId: string,
  variantName: string
): Promise<SyncResult> {
  try {
    // First get the variant_id from the variant_name
    const { data: variant, error: variantError } = await supabase
      .from('project_variants')
      .select('id')
      .eq('project_id', projectId)
      .eq('variant_name', variantName)
      .single();

    if (variantError || !variant) {
      return { synced: 0, conflicts: [], error: `Failed to find variant: ${variantError?.message || 'Variant not found'}` };
    }

    // Get equipment for the variant
    const { data: variantEquipment, error: equipmentError } = await supabase
      .from('project_equipment')
      .select(`
        *,
        equipment (
          id,
          name,
          stock
        )
      `)
      .eq('project_id', projectId)
      .eq('variant_id', variant.id);

    if (equipmentError) {
      return { synced: 0, conflicts: [], error: `Failed to fetch variant equipment: ${equipmentError.message}` };
    }

    if (!variantEquipment || variantEquipment.length === 0) {
      return { synced: 0, conflicts: [] };
    }

    // Check for existing event equipment
    const { data: existingEquipment } = await supabase
      .from('project_event_equipment')
      .select('equipment_id')
      .eq('project_id', projectId)
      .eq('event_id', eventId);

    const existingEquipmentIds = new Set(existingEquipment?.map(e => e.equipment_id) || []);
    const conflicts: VariantSyncConflict[] = [];

    // Create new equipment assignments for equipment that doesn't exist
    const equipmentToCreate = variantEquipment.filter(eq => !existingEquipmentIds.has(eq.equipment_id));

    if (equipmentToCreate.length === 0) {
      return { synced: 0, conflicts: [] };
    }

    // Check for equipment availability conflicts
    for (const item of equipmentToCreate) {
      if (item.equipment?.stock && item.quantity > item.equipment.stock) {
        conflicts.push({
          type: 'equipment_availability',
          resource_id: item.equipment_id,
          resource_name: item.equipment?.name || 'Unknown Equipment',
          conflict_reason: `Requested quantity (${item.quantity}) exceeds available stock (${item.equipment.stock})`,
          suggested_resolution: 'Reduce quantity or check equipment availability'
        });
      }
    }

    // Create the equipment assignments
    const equipmentAssignments = equipmentToCreate.map(item => ({
      project_id: projectId,
      event_id: eventId,
      equipment_id: item.equipment_id,
      group_id: item.group_id,
      quantity: item.quantity,
      notes: item.notes,
      is_synced: true
    }));

    const { error: insertError } = await supabase
      .from('project_event_equipment')
      .insert(equipmentAssignments);

    if (insertError) {
      return { synced: 0, conflicts, error: `Failed to create equipment assignments: ${insertError.message}` };
    }

    return { synced: equipmentAssignments.length, conflicts };

  } catch (error) {
    console.error('Error syncing equipment:', error);
    return { 
      synced: 0, 
      conflicts: [], 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkCrewMemberAvailability(crewMemberId: string, eventId: string): Promise<boolean> {
  try {
    // Get the date of the event we're syncing to
    const { data: event } = await supabase
      .from('project_events')
      .select('date')
      .eq('id', eventId)
      .single();

    if (!event) return false;

    // Check if crew member has other assignments on the same date
    const { data: conflicts } = await supabase
      .from('project_event_roles')
      .select(`
        id,
        project_events!inner (
          date
        )
      `)
      .eq('crew_member_id', crewMemberId)
      .eq('project_events.date', event.date)
      .neq('project_events.id', eventId);

    return (conflicts?.length || 0) > 0;

  } catch (error) {
    console.error('Error checking crew availability:', error);
    return false;
  }
}