import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarEvent } from "@/types/events";

export function useSyncStatus(event: CalendarEvent) {
  const [isSynced, setIsSynced] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    const checkSyncStatus = async () => {
      if (!event.type.needs_equipment) {
        setIsSynced(false);
        setIsChecking(false);
        return;
      }

      try {
        // Get project equipment
        const { data: projectEquipment } = await supabase
          .from('project_equipment')
          .select('equipment_id, quantity, group_id')
          .eq('project_id', event.project_id);

        // Get event equipment
        const { data: eventEquipment } = await supabase
          .from('project_event_equipment')
          .select('equipment_id, quantity, group_id')
          .eq('event_id', event.id);

        if (!projectEquipment || !eventEquipment) {
          setIsSynced(false);
          setIsChecking(false);
          return;
        }

        // Create maps for easier comparison
        const projectMap = new Map(
          projectEquipment.map(item => [
            item.equipment_id,
            { quantity: item.quantity, group_id: item.group_id }
          ])
        );

        const eventMap = new Map(
          eventEquipment.map(item => [
            item.equipment_id,
            { quantity: item.quantity, group_id: item.group_id }
          ])
        );

        // If there's no equipment in either the project or event, consider it not synced
        if (projectMap.size === 0 && eventMap.size === 0) {
          setIsSynced(false);
          setIsChecking(false);
          return;
        }

        // Check if project equipment matches event equipment
        let synced = true;
        
        // Check if project equipment matches event equipment
        for (const [equipId, projectItem] of projectMap) {
          const eventItem = eventMap.get(equipId);
          
          if (!eventItem || 
              eventItem.quantity !== projectItem.quantity || 
              eventItem.group_id !== projectItem.group_id) {
            synced = false;
            break;
          }
        }

        // Check if event has any extra equipment not in project
        if (synced) {
          for (const equipId of eventMap.keys()) {
            if (!projectMap.has(equipId)) {
              synced = false;
              break;
            }
          }
        }

        setIsSynced(synced);
      } catch (error) {
        console.error('Error checking sync status:', error);
        setIsSynced(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkSyncStatus();

    // Subscribe to changes in project_equipment and project_event_equipment
    const projectEquipmentSubscription = supabase
      .channel(`project-equipment-${event.project_id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_equipment',
        filter: `project_id=eq.${event.project_id}`
      }, () => {
        checkSyncStatus();
      })
      .subscribe();

    const eventEquipmentSubscription = supabase
      .channel(`event-equipment-${event.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_event_equipment',
        filter: `event_id=eq.${event.id}`
      }, () => {
        checkSyncStatus();
      })
      .subscribe();

    return () => {
      projectEquipmentSubscription.unsubscribe();
      eventEquipmentSubscription.unsubscribe();
    };
  }, [event]);

  return { isSynced, isChecking };
}