import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarEvent } from "@/types/events";

export function useEquipmentSync(event: CalendarEvent) {
  const [isSynced, setIsSynced] = useState(true);
  const queryClient = useQueryClient();

  const checkEquipmentStatus = async () => {
    if (!event.type.needs_equipment) {
      setIsSynced(true);
      return;
    }
    
    try {
      console.log('Checking equipment status for event:', event.id);
      
      // Get event equipment
      const { data: eventEquipment, error: eventError } = await supabase
        .from('project_event_equipment')
        .select(`
          id,
          equipment_id,
          quantity,
          is_synced
        `)
        .eq('event_id', event.id);

      if (eventError) throw eventError;

      // Get project equipment for comparison
      const { data: projectEquipment, error: projectError } = await supabase
        .from('project_equipment')
        .select(`
          id,
          equipment_id,
          quantity
        `)
        .eq('project_id', event.project_id);

      if (projectError) throw projectError;

      // Check if any equipment is out of sync
      const isOutOfSync = eventEquipment?.some(eventItem => {
        // Check if item exists in project equipment
        const projectItem = projectEquipment?.find(p => p.equipment_id === eventItem.equipment_id);
        
        // Item is out of sync if:
        // 1. It doesn't exist in project equipment
        // 2. Quantities don't match
        // 3. is_synced flag is false
        return !projectItem || 
               projectItem.quantity !== eventItem.quantity || 
               !eventItem.is_synced;
      });

      // Also check if project has new equipment not in event
      const hasNewEquipment = projectEquipment?.some(projectItem => 
        !eventEquipment?.some(e => e.equipment_id === projectItem.equipment_id)
      );

      console.log('Equipment sync status:', { 
        eventId: event.id, 
        isOutOfSync, 
        hasNewEquipment,
        eventEquipment,
        projectEquipment 
      });

      setIsSynced(!isOutOfSync && !hasNewEquipment);
    } catch (error) {
      console.error('Error checking equipment status:', error);
      setIsSynced(false);
    }
  };

  const handleEquipmentSync = async () => {
    try {
      // Create sync operation
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

      if (!projectEquipment) {
        throw new Error('No project equipment found');
      }

      // Delete existing event equipment
      const { error: deleteError } = await supabase
        .from('project_event_equipment')
        .delete()
        .eq('event_id', event.id);

      if (deleteError) throw deleteError;

      // Create new event equipment from project equipment
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

      // Update sync operation status
      const { error: updateError } = await supabase
        .from('sync_operations')
        .update({ status: 'completed' })
        .eq('event_id', event.id);

      if (updateError) throw updateError;

      await checkEquipmentStatus();
      
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['project-event-equipment', event.id] }),
        queryClient.invalidateQueries({ queryKey: ['events', event.project_id] }),
        queryClient.invalidateQueries({ queryKey: ['calendar-events', event.project_id] })
      ]);

      toast.success('Equipment list synchronized successfully');
    } catch (error) {
      console.error('Error syncing equipment:', error);
      toast.error('Failed to sync equipment list');
      
      // Update sync operation status with error
      const { error: updateError } = await supabase
        .from('sync_operations')
        .update({ 
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          attempts: 1
        })
        .eq('event_id', event.id);

      if (updateError) {
        console.error('Error updating sync operation:', updateError);
      }
      
      await checkEquipmentStatus();
    }
  };

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>;
    let projectEquipmentChannel: ReturnType<typeof supabase.channel>;

    const setupSubscriptions = async () => {
      if (!event.type.needs_equipment) return;

      await checkEquipmentStatus();

      projectEquipmentChannel = supabase
        .channel(`project-equipment-${event.project_id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'project_equipment',
            filter: `project_id=eq.${event.project_id}`
          },
          async (payload) => {
            console.log('Project equipment changed:', payload);
            await checkEquipmentStatus();
          }
        )
        .subscribe();

      channel = supabase
        .channel(`event-equipment-${event.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'project_event_equipment',
            filter: `event_id=eq.${event.id}`
          },
          async (payload) => {
            console.log('Event equipment changed:', payload);
            await checkEquipmentStatus();
            await queryClient.invalidateQueries({ queryKey: ['project-event-equipment', event.id] });
          }
        )
        .subscribe();
    };

    setupSubscriptions();

    return () => {
      if (channel) {
        console.log(`Unsubscribing from event ${event.id}`);
        channel.unsubscribe();
      }
      if (projectEquipmentChannel) {
        console.log(`Unsubscribing from project equipment ${event.project_id}`);
        projectEquipmentChannel.unsubscribe();
      }
    };
  }, [event.id, event.project_id, event.type.needs_equipment, queryClient]);

  return {
    isSynced,
    handleEquipmentSync,
    checkEquipmentStatus
  };
}