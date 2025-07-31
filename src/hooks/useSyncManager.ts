import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import debounce from 'lodash/debounce';

interface SyncOperation {
  type: 'equipment' | 'crew';
  projectId: string;
  eventId: string;
  date?: string;
}

export function useSyncManager() {
  const [isSyncing, setIsSyncing] = useState(false);
  const syncQueue = useRef<SyncOperation[]>([]);
  const queryClient = useQueryClient();

  // Debounced function to process sync queue
  const processSyncQueue = useCallback(
    debounce(async () => {
      if (syncQueue.current.length === 0) return;
      
      setIsSyncing(true);
      const operations = [...syncQueue.current];
      syncQueue.current = [];

      try {
        // Group operations by project for batch processing
        const projectGroups = operations.reduce((acc, op) => {
          if (!acc[op.projectId]) acc[op.projectId] = [];
          acc[op.projectId].push(op);
          return acc;
        }, {} as Record<string, SyncOperation[]>);

        // Process each project's operations
        for (const [projectId, ops] of Object.entries(projectGroups)) {
          try {
            // Process equipment syncs using RPC functions
            const equipmentOps = ops.filter(op => op.type === 'equipment');
            for (const op of equipmentOps) {
              const { error } = await supabase.rpc('sync_event_equipment', {
                p_event_id: op.eventId,
                p_project_id: op.projectId
              });
              if (error) throw error;
            }

            // Process crew syncs using RPC functions
            const crewOps = ops.filter(op => op.type === 'crew');
            for (const op of crewOps) {
              const { error } = await supabase.rpc('sync_event_crew', {
                p_event_id: op.eventId,
                p_project_id: op.projectId
              });
              if (error) throw error;
            }

            // Batch invalidate queries
            const queriesToInvalidate = new Set<string>();
            ops.forEach(op => {
              queriesToInvalidate.add(['events', op.projectId].join('/'));
              queriesToInvalidate.add(['project-event-equipment', op.eventId].join('/'));
              queriesToInvalidate.add(['project-equipment', op.projectId].join('/'));
              queriesToInvalidate.add(['calendar-events', op.projectId].join('/'));
              queriesToInvalidate.add(['project-events', op.projectId].join('/'));
              queriesToInvalidate.add(['sync-status'].join('/'));
            });

            await Promise.all(
              Array.from(queriesToInvalidate).map(queryKey => 
                queryClient.invalidateQueries({ queryKey: queryKey.split('/') })
              )
            );

            toast.success('Sync completed successfully');
          } catch (error: any) {
            console.error('Error processing operations:', error);
            toast.error(error.message || 'Failed to sync');
            throw error;
          }
        }
      } catch (error) {
        console.error('Error processing sync queue:', error);
        toast.error('Failed to sync some operations');
      } finally {
        setIsSyncing(false);
      }
    }, 500),
    [queryClient]
  );

  const queueSync = useCallback((operation: SyncOperation) => {
    syncQueue.current.push(operation);
    processSyncQueue();
  }, [processSyncQueue]);

  return {
    isSyncing,
    queueSync
  };
} 