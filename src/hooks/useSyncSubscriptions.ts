import { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

type SyncOperationPayload = RealtimePostgresChangesPayload<{
  [key: string]: any;
  status: string;
  event_id: string;
  error_message?: string;
}>;

type ProjectEquipmentPayload = RealtimePostgresChangesPayload<{
  [key: string]: any;
  project_id: string;
}>;

type EventEquipmentPayload = RealtimePostgresChangesPayload<{
  [key: string]: any;
  event_id: string;
}>;

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
        async (payload: SyncOperationPayload) => {
          console.log('Sync operation update:', payload);
          
          if (payload.new.status === 'completed') {
            toast.success('Equipment sync completed');
            await queryClient.invalidateQueries({ 
              queryKey: ['project-event-equipment', payload.new.event_id] 
            });
          } else if (payload.new.status === 'failed') {
            toast.error(`Sync failed: ${payload.new.error_message || 'Unknown error'}`);
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
        async (payload: ProjectEquipmentPayload) => {
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
        async (payload: EventEquipmentPayload) => {
          console.log('Event equipment changed:', payload);
          const eventId = payload.new?.event_id || payload.old?.event_id;
          if (eventId) {
            await queryClient.invalidateQueries({ 
              queryKey: ['project-event-equipment', eventId] 
            });
          }
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