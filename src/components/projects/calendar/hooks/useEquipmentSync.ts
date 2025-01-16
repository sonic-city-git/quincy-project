import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarEvent } from "@/types/events";

export function useEquipmentSync(event: CalendarEvent) {
  const [isSynced, setIsSynced] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const queryClient = useQueryClient();

  const checkEquipmentStatus = async () => {
    if (!event.type.needs_equipment) {
      setIsSynced(true);
      return;
    }
    
    if (isChecking) return;
    setIsChecking(true);
    
    try {
      console.log('Checking equipment status for event:', event.id);
      
      const { data: eventEquipment, error: eventError } = await supabase
        .from('project_event_equipment')
        .select(`
          id,
          equipment_id,
          quantity,
          is_synced,
          group_id
        `)
        .eq('event_id', event.id);

      if (eventError) throw eventError;

      const { data: projectEquipment, error: projectError } = await supabase
        .from('project_equipment')
        .select(`
          id,
          equipment_id,
          quantity,
          group_id
        `)
        .eq('project_id', event.project_id);

      if (projectError) throw projectError;

      // Create maps for faster lookup
      const projectMap = new Map(projectEquipment?.map(item => [item.equipment_id, item]));
      const eventMap = new Map(eventEquipment?.map(item => [item.equipment_id, item]));

      const isOutOfSync = Boolean(
        projectEquipment?.some(projectItem => {
          const eventItem = eventMap.get(projectItem.equipment_id);
          return !eventItem || 
                 eventItem.quantity !== projectItem.quantity ||
                 eventItem.group_id !== projectItem.group_id ||
                 !eventItem.is_synced;
        }) ||
        eventEquipment?.some(eventItem => !projectMap.has(eventItem.equipment_id))
      );

      console.log('Equipment sync status:', { 
        eventId: event.id, 
        isOutOfSync,
        eventEquipment,
        projectEquipment 
      });

      setIsSynced(!isOutOfSync);
    } catch (error) {
      console.error('Error checking equipment status:', error);
      setIsSynced(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleEquipmentSync = async () => {
    try {
      const { error: syncError } = await supabase
        .from('sync_operations')
        .insert({
          project_id: event.project_id,
          event_id: event.id,
          status: 'pending'
        });

      if (syncError) throw syncError;

      const { data: projectEquipment, error: fetchError } = await supabase
        .from('project_equipment')
        .select('*')
        .eq('project_id', event.project_id);

      if (fetchError) throw fetchError;

      if (!projectEquipment) {
        throw new Error('No project equipment found');
      }

      const { error: deleteError } = await supabase
        .from('project_event_equipment')
        .delete()
        .eq('event_id', event.id);

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
          async () => {
            console.log('Project equipment changed, checking sync status');
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
          async () => {
            console.log('Event equipment changed, checking sync status');
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