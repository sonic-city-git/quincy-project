import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarEvent } from "@/types/events";

export function useSectionSyncStatus(events: CalendarEvent[]) {
  const [sectionSyncStatus, setSectionSyncStatus] = useState<'synced' | 'not-synced' | 'no-equipment'>('no-equipment');

  useEffect(() => {
    const checkSectionSyncStatus = async () => {
      // First check if any events need equipment based on their type
      const eventsWithEquipment = events.filter(event => event.type.needs_equipment);
      
      if (eventsWithEquipment.length === 0) {
        setSectionSyncStatus('no-equipment');
        return;
      }

      try {
        const promises = eventsWithEquipment.map(async (event) => {
          const { data: eventEquipment } = await supabase
            .from('project_event_equipment')
            .select('is_synced')
            .eq('event_id', event.id);

          // If event has no equipment but needs it, consider it as "not synced"
          if (!eventEquipment || eventEquipment.length === 0) {
            return { hasEquipment: false, isSynced: false };
          }

          return {
            hasEquipment: true,
            isSynced: eventEquipment.every(item => item.is_synced)
          };
        });

        const results = await Promise.all(promises);
        
        // If any event that needs equipment doesn't have it, or has unsynced equipment
        // mark the section as not synced
        const hasUnsynced = results.some(r => !r.isSynced);
        setSectionSyncStatus(hasUnsynced ? 'not-synced' : 'synced');

      } catch (error) {
        console.error('Error checking section sync status:', error);
        setSectionSyncStatus('no-equipment');
      }
    };

    checkSectionSyncStatus();

    const channels = events.map(event => {
      return supabase
        .channel(`section-equipment-${event.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'project_event_equipment',
          filter: `event_id=eq.${event.id}`
        }, () => {
          checkSectionSyncStatus();
        })
        .subscribe();
    });

    return () => {
      channels.forEach(channel => channel.unsubscribe());
    };
  }, [events]);

  return sectionSyncStatus;
}