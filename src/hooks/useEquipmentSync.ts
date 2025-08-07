import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Unified equipment sync hook - handles all equipment sync scenarios
 * Replaces multiple deprecated sync methods with a single unified approach
 */
export function useEquipmentSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  /**
   * Sync equipment for a single event
   */
  const syncEvent = async (eventId: string, projectId: string, variantName?: string): Promise<boolean> => {
    setIsSyncing(true);
    try {
      const { error } = await supabase.rpc('sync_event_equipment_unified', {
        p_event_id: eventId,
        p_project_id: projectId,
        p_variant_name: variantName || 'default'
      });

      if (error) {
        console.error('❌ [SYNC] Equipment sync failed:', error);
        toast.error(`Sync failed: ${error.message}`);
        return false;
      }

      // Invalidate related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['project-event-equipment', eventId] }),
        queryClient.invalidateQueries({ queryKey: ['sync-status', eventId] })
      ]);

      console.log('✅ [SYNC] Equipment synced successfully');
      toast.success("Equipment synced successfully");
      return true;
    } catch (error: any) {
      console.error('❌ [SYNC] Unexpected error:', error);
      toast.error(error.message || "Failed to sync equipment");
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Sync equipment for multiple events (batch operation)
   */
  const syncEvents = async (events: Array<{ id: string; project_id: string; variant_name?: string }>): Promise<boolean> => {
    setIsSyncing(true);
    try {
      let successCount = 0;
      let failureCount = 0;

      // Process each event
      for (const event of events) {
        const { error } = await supabase.rpc('sync_event_equipment_unified', {
          p_event_id: event.id,
          p_project_id: event.project_id,
          p_variant_name: event.variant_name || 'default'
        });

        if (error) {
          console.error(`❌ [BATCH-SYNC] Failed for event ${event.id}:`, error);
          failureCount++;
        } else {
          successCount++;
        }
      }

      // Invalidate queries for all affected projects
      const projectIds = [...new Set(events.map(e => e.project_id))];
      await Promise.all(
        projectIds.flatMap(projectId => [
          queryClient.invalidateQueries({ queryKey: ['events', projectId] }),
          queryClient.invalidateQueries({ queryKey: ['project-event-equipment'] }),
          queryClient.invalidateQueries({ queryKey: ['sync-status'] })
        ])
      );

      // Show appropriate message
      if (failureCount === 0) {
        toast.success(`Equipment synced to all ${successCount} events`);
        return true;
      } else if (successCount > 0) {
        toast.warning(`Synced ${successCount} events, ${failureCount} failed`);
        return false;
      } else {
        toast.error("Failed to sync any events");
        return false;
      }
    } catch (error: any) {
      console.error('❌ [BATCH-SYNC] Unexpected error:', error);
      toast.error("Batch sync failed");
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    syncEvent,      // Single event sync
    syncEvents,     // Multiple event sync  
    isSyncing       // Loading state
  };
}