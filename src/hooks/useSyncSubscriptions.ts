import { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface SyncOperation {
  id: string;
  project_id: string;
  event_id: string;
  status: string;
  attempts: number;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}

interface ProjectEquipment {
  id: string;
  project_id: string;
  equipment_id: string;
  quantity: number;
  group_id?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface EventEquipment {
  id: string;
  project_id: string;
  event_id: string;
  equipment_id: string;
  quantity: number;
  group_id?: string;
  notes?: string;
  is_synced: boolean;
  created_at?: string;
  updated_at?: string;
}

type SyncOperationPayload = RealtimePostgresChangesPayload<SyncOperation>;
type ProjectEquipmentPayload = RealtimePostgresChangesPayload<ProjectEquipment>;
type EventEquipmentPayload = RealtimePostgresChangesPayload<EventEquipment>;

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
          
          const newData = payload.new as SyncOperation;
          if (newData?.status === 'completed') {
            toast.success('Equipment sync completed');
            await queryClient.invalidateQueries({ 
              queryKey: ['project-event-equipment', newData.event_id] 
            });
          } else if (newData?.status === 'failed') {
            toast.error(`Sync failed: ${newData.error_message || 'Unknown error'}`);
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
          console.log('Project equipment changed:', payload);
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
          const newData = payload.new as EventEquipment;
          const oldData = payload.old as EventEquipment;
          const eventId = newData?.event_id || oldData?.event_id;
          
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