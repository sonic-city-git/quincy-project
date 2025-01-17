import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarEvent } from "@/types/events";
import { useQueryClient } from "@tanstack/react-query";

export function useSyncOperations(event: CalendarEvent) {
  const queryClient = useQueryClient();

  const handleEquipmentSync = useCallback(async () => {
    try {
      // Create sync operation record
      const { error: syncError } = await supabase
        .from('sync_operations')
        .insert({
          project_id: event.project_id,
          event_id: event.id,
          status: 'pending'
        });

      if (syncError) throw syncError;

      // Get project equipment
      const { data: projectEquipment, error: fetchError } = await supabase
        .from('project_equipment')
        .select('*')
        .eq('project_id', event.project_id);

      if (fetchError) throw fetchError;

      // Delete existing event equipment
      const { error: deleteError } = await supabase
        .from('project_event_equipment')
        .delete()
        .eq('event_id', event.id);

      if (deleteError) throw deleteError;

      // Create new event equipment from project equipment
      if (projectEquipment && projectEquipment.length > 0) {
        const eventEquipment = projectEquipment.map(item => ({
          project_id: event.project_id,
          event_id: event.id,
          equipment_id: item.equipment_id,
          quantity: item.quantity,
          group_id: item.group_id,
          is_synced: true
        }));

        const { error: insertError } = await supabase
          .from('project_event_equipment')
          .insert(eventEquipment);

        if (insertError) throw insertError;
      }

      // Update sync operation status
      const { error: updateError } = await supabase
        .from('sync_operations')
        .update({ status: 'completed' })
        .eq('event_id', event.id);

      if (updateError) throw updateError;

      // Invalidate queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['project-event-equipment', event.id] }),
        queryClient.invalidateQueries({ queryKey: ['events', event.project_id] }),
        queryClient.invalidateQueries({ queryKey: ['calendar-events', event.project_id] })
      ]);

      toast.success('Equipment list synchronized successfully');
    } catch (error) {
      console.error('Error syncing equipment:', error);
      toast.error('Failed to sync equipment list');
      
      const { error: updateError } = await supabase
        .from('sync_operations')
        .update({ 
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('event_id', event.id);

      if (updateError) {
        console.error('Error updating sync operation:', updateError);
      }
    }
  }, [event.id, event.project_id, queryClient]);

  return {
    handleEquipmentSync
  };
}