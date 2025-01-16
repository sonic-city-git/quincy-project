import { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useSyncSubscriptions(projectId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId) return;

    console.log('Setting up sync subscriptions for project:', projectId);

    // Subscribe to sync_operations changes
    const syncChannel = supabase
      .channel('sync-operations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sync_operations',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          console.log('Sync operation update:', payload);
          
          if (payload.new.status === 'completed') {
            toast.success('Equipment sync completed');
            await queryClient.invalidateQueries({ 
              queryKey: ['project-event-equipment', payload.new.event_id] 
            });
          } else if (payload.new.status === 'failed') {
            toast.error(`Sync failed: ${payload.new.error_message}`);
          }
        }
      )
      .subscribe();

    // Subscribe to project_equipment changes
    const equipmentChannel = supabase
      .channel('project-equipment')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_equipment',
          filter: `project_id=eq.${projectId}`
        },
        async () => {
          console.log('Project equipment changed, invalidating queries');
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['project-equipment', projectId] }),
            queryClient.invalidateQueries({ queryKey: ['events', projectId] })
          ]);
        }
      )
      .subscribe();

    // Subscribe to project_event_equipment changes
    const eventEquipmentChannel = supabase
      .channel('event-equipment')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_event_equipment',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          console.log('Event equipment changed:', payload);
          await queryClient.invalidateQueries({ 
            queryKey: ['project-event-equipment', payload.new?.event_id || payload.old?.event_id] 
          });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up sync subscriptions');
      supabase.removeChannel(syncChannel);
      supabase.removeChannel(equipmentChannel);
      supabase.removeChannel(eventEquipmentChannel);
    };
  }, [projectId, queryClient]);
}