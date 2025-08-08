/**
 * 🔄 VARIANT EVENT SYNC UTILITIES
 * 
 * ⚠️ DEPRECATED: Phase 2 Architecture - Use reactive pricing instead
 * @deprecated Use @/services/pricing for automatic pricing updates
 * 
 * Legacy sync approach replaced by reactive pricing system.
 * Only kept for manual sync operations (crew assignments, equipment sync).
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VariantEventSyncOptions {
  projectId: string;
  variantId: string;
  syncType?: 'crew' | 'equipment' | 'all';
  showProgress?: boolean;
}

/**
 * Sync all events that use a specific variant
 * This ensures pricing and content updates propagate to all events
 */
export async function syncAllEventsForVariant({
  projectId,
  variantId,
  syncType = 'all',
  showProgress = true
}: VariantEventSyncOptions): Promise<void> {
  try {
    if (showProgress) {
      toast.info('Updating event prices...');
    }

    // 1. Find all events using this variant
    const { data: events, error: eventsError } = await supabase
      .from('project_events')
      .select('id, name')
      .eq('project_id', projectId)
      .eq('variant_id', variantId);

    if (eventsError) {
      throw new Error(`Failed to find events: ${eventsError.message}`);
    }

    if (!events || events.length === 0) {
      console.log(`No events found using variant ${variantId}`);
      return;
    }

    console.log(`🔄 Syncing ${events.length} events for variant ${variantId}:`, events.map(e => e.name));

    // 2. Sync each event based on sync type
    const syncPromises = events.map(async (event) => {
      const calls = [];

      if (syncType === 'crew' || syncType === 'all') {
        calls.push(
          supabase.rpc('sync_event_crew', {
            p_event_id: event.id,
            p_project_id: projectId,
            p_variant_id: variantId
          })
        );
      }

      if (syncType === 'equipment' || syncType === 'all') {
        calls.push(
          supabase.rpc('sync_event_equipment_unified', {
            p_event_id: event.id,
            p_project_id: projectId,
            p_variant_id: variantId
          })
        );
      }

      // Execute all sync calls for this event
      const results = await Promise.all(calls);
      
      // Check for errors
      for (const result of results) {
        if (result.error) {
          console.error(`❌ Sync error for event ${event.name}:`, result.error);
          throw new Error(`Failed to sync event "${event.name}": ${result.error.message}`);
        }
      }

      console.log(`✅ Synced event: ${event.name}`);
    });

    // 3. Execute all syncs in parallel
    await Promise.all(syncPromises);

    if (showProgress) {
      toast.success(`Updated prices for ${events.length} events`);
    }

    console.log(`✅ Successfully synced ${events.length} events for variant ${variantId}`);

  } catch (error) {
    console.error('❌ Variant event sync failed:', error);
    
    if (showProgress) {
      toast.error(`Failed to update event prices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    throw error;
  }
}

/**
 * Sync events when crew rates change
 * Optimized for crew-only updates
 */
export async function syncEventsForCrewRateChange(
  projectId: string,
  variantId: string
): Promise<void> {
  return syncAllEventsForVariant({
    projectId,
    variantId,
    syncType: 'crew',
    showProgress: true
  });
}

/**
 * Sync events when equipment changes
 * Optimized for equipment-only updates
 */
export async function syncEventsForEquipmentChange(
  projectId: string,
  variantId: string
): Promise<void> {
  return syncAllEventsForVariant({
    projectId,
    variantId,
    syncType: 'equipment',
    showProgress: true
  });
}
