import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarEvent } from "@/types/events";

export function useSyncStatus(event: CalendarEvent) {
  const [isSynced, setIsSynced] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [hasProjectEquipment, setHasProjectEquipment] = useState<boolean>(false);

  useEffect(() => {
    const checkSyncStatus = async () => {
      setIsChecking(true);
      
      try {
        // If event doesn't need equipment, set as synced
        if (!event.type.needs_equipment) {
          setIsSynced(true);
          setHasProjectEquipment(false);
          setIsChecking(false);
          return;
        }

        // First check if project has any equipment
        const { data: projectEquipment } = await supabase
          .from('project_equipment')
          .select('id')
          .eq('project_id', event.project_id)
          .limit(1);

        const projectHasEquipment = projectEquipment && projectEquipment.length > 0;
        setHasProjectEquipment(projectHasEquipment);

        // If project has no equipment, set as synced (will show grey icon)
        if (!projectHasEquipment) {
          setIsSynced(true);
          setIsChecking(false);
          return;
        }

        // Check if event has any equipment
        const { data: eventEquipment } = await supabase
          .from('project_event_equipment')
          .select('is_synced')
          .eq('event_id', event.id);

        // If no equipment exists but project has equipment, mark as not synced (blue)
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

  return { isSynced, isChecking, hasProjectEquipment };
}