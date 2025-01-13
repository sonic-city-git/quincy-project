import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarEvent } from "@/types/events";

export function useEquipmentSync(event: CalendarEvent) {
  const [isSynced, setIsSynced] = useState(true);
  const queryClient = useQueryClient();

  const checkEquipmentStatus = async () => {
    if (!event.type.needs_equipment) return;
    
    try {
      console.log('Checking equipment status for event:', event.id);
      
      const { data: eventEquipment, error } = await supabase
        .from('project_event_equipment')
        .select('is_synced')
        .eq('event_id', event.id);

      if (error) throw error;

      const syncStatus = eventEquipment?.every(item => item.is_synced) ?? true;
      console.log('Equipment sync status:', { eventId: event.id, syncStatus, eventEquipment });
      setIsSynced(syncStatus);
    } catch (error) {
      console.error('Error checking equipment status:', error);
      setIsSynced(true);
    }
  };

  const handleEquipmentSync = async () => {
    try {
      const { data: outOfSyncEquipment, error: syncError } = await supabase
        .from('project_event_equipment')
        .select('equipment_id')
        .eq('event_id', event.id)
        .eq('is_synced', false);

      if (syncError) throw syncError;

      if (!outOfSyncEquipment || outOfSyncEquipment.length === 0) {
        toast.info('Equipment is already in sync');
        return;
      }

      const { data: projectEquipment, error: fetchError } = await supabase
        .from('project_equipment')
        .select('*')
        .eq('project_id', event.project_id)
        .in('equipment_id', outOfSyncEquipment.map(e => e.equipment_id));

      if (fetchError) throw fetchError;

      if (!projectEquipment) {
        toast.error('Failed to fetch project equipment');
        return;
      }

      const { error: deleteError } = await supabase
        .from('project_event_equipment')
        .delete()
        .eq('event_id', event.id)
        .in('equipment_id', outOfSyncEquipment.map(e => e.equipment_id));

      if (deleteError) throw deleteError;

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