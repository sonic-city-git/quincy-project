import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalendarEvent } from "@/types/events";
import { useEffect } from "react";

export function useSyncStatus(event: CalendarEvent | null) {
  const queryClient = useQueryClient();

  const { data, isLoading: isChecking } = useQuery({
    queryKey: ['sync-status', event?.id],
    queryFn: async () => {
      if (!event || !event.type?.needs_equipment) {
        return {
          isSynced: true,
          hasProjectEquipment: false
        };
      }

      // First check if project has any equipment
      const { data: projectEquipment } = await supabase
        .from('project_equipment')
        .select('equipment_id, quantity')
        .eq('project_id', event.project_id);

      const hasProjectEquipment = !!projectEquipment && projectEquipment.length > 0;

      if (!hasProjectEquipment) {
        return {
          isSynced: true,
          hasProjectEquipment: false
        };
      }

      // Get event equipment separately
      const { data: eventEquipment } = await supabase
        .from('project_event_equipment')
        .select('equipment_id, quantity, is_synced')
        .eq('event_id', event.id);

      // If no event equipment exists, it's not synced
      if (!eventEquipment || eventEquipment.length === 0) {
        return {
          isSynced: false,
          hasProjectEquipment: true
        };
      }

      // Create maps for easy comparison
      const projectMap = new Map(projectEquipment.map(item => [item.equipment_id, item.quantity]));
      const eventMap = new Map(eventEquipment.map(item => [item.equipment_id, { quantity: item.quantity, is_synced: item.is_synced }]));

      // Check if all project equipment is synced to the event with correct quantities
      const isSynced = projectEquipment.every(projectItem => {
        const eventItem = eventMap.get(projectItem.equipment_id);
        return eventItem && 
               eventItem.is_synced && 
               eventItem.quantity === projectItem.quantity;
      });

      return {
        isSynced,
        hasProjectEquipment: true
      };
    },
    enabled: !!event?.id && !!event?.project_id
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!event?.id) return;

    const channel = supabase
      .channel(`sync-status-${event.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_event_equipment',
        filter: `event_id=eq.${event.id}`
      }, () => {
        // Invalidate the query to trigger a refresh
        queryClient.invalidateQueries({ queryKey: ['sync-status', event.id] });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [event?.id, queryClient]);

  return {
    isSynced: data?.isSynced ?? false,
    hasProjectEquipment: data?.hasProjectEquipment ?? false,
    isChecking
  };
}