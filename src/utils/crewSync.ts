/**
 * 🔄 CREW SYNC UTILITIES
 * 
 * Utilities for manually syncing crew roles when variants change.
 * When crew roles are added to a variant, existing events need to be re-synced.
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Sync crew roles for all events using a specific variant
 */
export async function syncVariantCrewToAllEvents(
  projectId: string, 
  variantId: string
): Promise<{ success: boolean; eventsUpdated: number; errors: string[] }> {
  try {
    console.log('🔄 Syncing crew roles for variant:', { projectId, variantId });
    
    // Get all events using this variant
    const { data: events, error: eventsError } = await supabase
      .from('project_events')
      .select('id, name')
      .eq('project_id', projectId)
      .eq('variant_id', variantId);
    
    if (eventsError) {
      throw new Error(`Failed to fetch events: ${eventsError.message}`);
    }
    
    if (!events || events.length === 0) {
      console.log('✅ No events found for variant, nothing to sync');
      return { success: true, eventsUpdated: 0, errors: [] };
    }
    
    console.log(`🎯 Found ${events.length} events to sync:`, events.map(e => e.name));
    
    const errors: string[] = [];
    let successCount = 0;
    
    // Sync each event individually
    for (const event of events) {
      try {
        console.log(`🔄 Syncing crew for event: ${event.name} (${event.id})`);
        
        const { error: syncError } = await supabase.rpc('sync_event_crew', {
          p_event_id: event.id,
          p_project_id: projectId,
          p_variant_id: variantId
        });
        
        if (syncError) {
          console.error(`❌ Failed to sync crew for event ${event.name}:`, syncError);
          errors.push(`${event.name}: ${syncError.message}`);
        } else {
          console.log(`✅ Successfully synced crew for event: ${event.name}`);
          successCount++;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error(`❌ Error syncing event ${event.name}:`, err);
        errors.push(`${event.name}: ${errorMsg}`);
      }
    }
    
    const result = {
      success: errors.length === 0,
      eventsUpdated: successCount,
      errors
    };
    
    console.log('🎯 Crew sync completed:', result);
    return result;
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Critical error in crew sync:', error);
    return {
      success: false,
      eventsUpdated: 0,
      errors: [errorMsg]
    };
  }
}

/**
 * Sync crew roles for a single event
 */
export async function syncEventCrew(
  eventId: string,
  projectId: string,
  variantId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔄 Syncing crew for single event:', { eventId, projectId, variantId });
    
    const { error } = await supabase.rpc('sync_event_crew', {
      p_event_id: eventId,
      p_project_id: projectId,
      p_variant_id: variantId || null
    });
    
    if (error) {
      console.error('❌ Failed to sync event crew:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Successfully synced event crew');
    return { success: true };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error syncing event crew:', error);
    return { success: false, error: errorMsg };
  }
}

/**
 * Sync crew roles for all events in a project (useful for fixing missing crew roles)
 */
export async function syncAllProjectEventsCrew(
  projectId: string
): Promise<{ success: boolean; eventsUpdated: number; errors: string[] }> {
  try {
    console.log('🔄 Syncing crew roles for entire project:', projectId);
    
    // Get all events in the project with their variants
    const { data: events, error: eventsError } = await supabase
      .from('project_events')
      .select(`
        id, 
        name, 
        variant_id,
        project_variants!inner(id, variant_name)
      `)
      .eq('project_id', projectId)
      .neq('status', 'cancelled');
    
    if (eventsError) {
      throw new Error(`Failed to fetch events: ${eventsError.message}`);
    }
    
    if (!events || events.length === 0) {
      console.log('✅ No events found in project');
      return { success: true, eventsUpdated: 0, errors: [] };
    }
    
    console.log(`🎯 Found ${events.length} events to sync across all variants`);
    
    const errors: string[] = [];
    let successCount = 0;
    
    // Sync each event
    for (const event of events) {
      try {
        const result = await syncEventCrew(event.id, projectId, event.variant_id);
        
        if (result.success) {
          successCount++;
        } else {
          errors.push(`${event.name}: ${result.error}`);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`${event.name}: ${errorMsg}`);
      }
    }
    
    const result = {
      success: errors.length === 0,
      eventsUpdated: successCount,
      errors
    };
    
    console.log('🎯 Project crew sync completed:', result);
    return result;
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Critical error in project crew sync:', error);
    return {
      success: false,
      eventsUpdated: 0,
      errors: [errorMsg]
    };
  }
}

/**
 * User-friendly wrapper that shows toast notifications
 */
export async function syncVariantCrewWithToast(
  projectId: string,
  variantId: string,
  variantName?: string
): Promise<void> {
  const displayName = variantName || 'variant';
  
  // Show loading toast
  const loadingToast = toast.loading(`Syncing crew roles for ${displayName}...`);
  
  try {
    const result = await syncVariantCrewToAllEvents(projectId, variantId);
    
    // Dismiss loading toast
    toast.dismiss(loadingToast);
    
    if (result.success) {
      if (result.eventsUpdated > 0) {
        toast.success(
          `✅ Crew roles synced to ${result.eventsUpdated} event${result.eventsUpdated > 1 ? 's' : ''}`
        );
      } else {
        toast.info('ℹ️ No events needed crew sync');
      }
    } else {
      toast.error(`❌ Crew sync failed: ${result.errors.join(', ')}`);
    }
  } catch (error) {
    toast.dismiss(loadingToast);
    toast.error('❌ Failed to sync crew roles');
    console.error('Crew sync error:', error);
  }
}
