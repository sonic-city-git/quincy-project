import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarEvent } from "@/types/events";

export function useSyncStatus(event: CalendarEvent) {
  const [isSynced, setIsSynced] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    const checkSyncStatus = async () => {
      setIsChecking(true);
      
      try {
        // If event doesn't need equipment, set as synced
        if (!event.type.needs_equipment) {
          setIsSynced(true);
          setIsChecking(false);
          return;
        }

        // Check if event has any equipment
        const { data: eventEquipment } = await supabase
          .from('project_event_equipment')
          .select('is_synced')
          .eq('event_id', event.id);

        // If no equipment exists, set as "no equipment" state (not synced)
        if (!eventEquipment || eventEquipment.length === 0) {
          setIsSynced(false);
          setIsChecking(false);
          return;
        }

        // Check if all equipment is synced
        const allSynced = eventEquipment.every(item => item.is_synced);
        setIsSynced(allSynced);
      } catch (error) {
        console.error('Error checking sync status:', error);
        setIsSynced(false);
      }

      setIsChecking(false);
    };

    checkSyncStatus();

    // Subscribe to changes
    const channel = supabase
      .channel(`sync-status-${event.id}`)
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
      channel.unsubscribe();
    };
  }, [event]);

  return { isSynced, isChecking };
}