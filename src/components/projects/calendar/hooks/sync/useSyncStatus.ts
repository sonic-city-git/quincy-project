import { useState, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { CalendarEvent } from "@/types/events";
import { useQueryClient } from "@tanstack/react-query";

export function useSyncStatus(event: CalendarEvent) {
  const [isSynced, setIsSynced] = useState(true);
  const mountedRef = useRef(true);
  const isCheckingRef = useRef(false);
  const queryClient = useQueryClient();

  const checkSyncStatus = async () => {
    if (isCheckingRef.current || !mountedRef.current) return;
    isCheckingRef.current = true;

    try {
      // If event doesn't need equipment, it's always synced
      if (!event.type.needs_equipment) {
        setIsSynced(true);
        return;
      }

      // Get event equipment
      const { data: eventEquipment, error: eventError } = await supabase
        .from('project_event_equipment')
        .select('equipment_id, quantity, group_id')
        .eq('event_id', event.id);

      if (eventError) throw eventError;

      // Get project equipment
      const { data: projectEquipment, error: projectError } = await supabase
        .from('project_equipment')
        .select('equipment_id, quantity, group_id')
        .eq('project_id', event.project_id);

      if (projectError) throw projectError;

      // If event has no equipment but project has equipment, it's out of sync
      if (!eventEquipment || eventEquipment.length === 0) {
        setIsSynced(projectEquipment?.length === 0);
        return;
      }

      // Create maps for comparison
      const projectMap = new Map(
        projectEquipment?.map(item => [item.equipment_id, item]) || []
      );
      const eventMap = new Map(
        eventEquipment?.map(item => [item.equipment_id, item]) || []
      );

      // Check for differences
      const isOutOfSync = (
        // Check if event has items not in project
        eventEquipment.some(eventItem => !projectMap.has(eventItem.equipment_id)) ||
        // Check if project has items not in event
        projectEquipment?.some(projectItem => !eventMap.has(projectItem.equipment_id)) ||
        // Check for quantity/group mismatches
        eventEquipment.some(eventItem => {
          const projectItem = projectMap.get(eventItem.equipment_id);
          return !projectItem || 
                 eventItem.quantity !== projectItem.quantity ||
                 eventItem.group_id !== projectItem.group_id;
        })
      );

      if (mountedRef.current) {
        setIsSynced(!isOutOfSync);
      }
    } catch (error) {
      console.error('Error checking sync status:', error);
      if (mountedRef.current) {
        setIsSynced(false);
      }
    } finally {
      isCheckingRef.current = false;
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    
    // Initial check
    checkSyncStatus();

    // Subscribe to changes
    const projectEquipmentChannel = supabase
      .channel(`project-equipment-${event.project_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_equipment',
          filter: `project_id=eq.${event.project_id}`
        },
        () => {
          console.log('Project equipment changed, checking sync status');
          checkSyncStatus();
        }
      )
      .subscribe();

    const eventEquipmentChannel = supabase
      .channel(`event-equipment-${event.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_event_equipment',
          filter: `event_id=eq.${event.id}`
        },
        () => {
          console.log('Event equipment changed, checking sync status');
          checkSyncStatus();
        }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(projectEquipmentChannel);
      supabase.removeChannel(eventEquipmentChannel);
    };
  }, [event.id, event.project_id]);

  return {
    isSynced,
    checkSyncStatus
  };
}