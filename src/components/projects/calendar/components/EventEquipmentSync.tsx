import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventEquipmentSyncProps {
  eventId: string;
  projectId: string;
  needsEquipment: boolean;
}

export function EventEquipmentSync({ eventId, projectId, needsEquipment }: EventEquipmentSyncProps) {
  const [isSynced, setIsSynced] = useState(true);
  const queryClient = useQueryClient();

  const checkEquipmentStatus = async () => {
    if (!needsEquipment) return;
    
    try {
      const { data: eventEquipment } = await supabase
        .from('project_event_equipment')
        .select('is_synced')
        .eq('event_id', eventId);

      const syncStatus = eventEquipment?.every(item => item.is_synced) ?? true;
      setIsSynced(syncStatus);
      console.log('Equipment sync status updated:', { eventId, syncStatus });
    } catch (error) {
      console.error('Error checking equipment status:', error);
      setIsSynced(true);
    }
  };

  const handleEquipmentSync = async () => {
    try {
      const { data: projectEquipment, error: fetchError } = await supabase
        .from('project_equipment')
        .select('*')
        .eq('project_id', projectId);

      if (fetchError) throw fetchError;

      if (projectEquipment && projectEquipment.length > 0) {
        const uniqueEquipment = new Map();
        
        projectEquipment.forEach(item => {
          if (uniqueEquipment.has(item.equipment_id)) {
            const existing = uniqueEquipment.get(item.equipment_id);
            existing.quantity += item.quantity;
            uniqueEquipment.set(item.equipment_id, existing);
          } else {
            uniqueEquipment.set(item.equipment_id, item);
          }
        });

        const eventEquipment = Array.from(uniqueEquipment.values()).map(item => ({
          project_id: projectId,
          event_id: eventId,
          equipment_id: item.equipment_id,
          quantity: item.quantity,
          group_id: item.group_id,
          is_synced: true
        }));

        const { error: deleteError } = await supabase
          .from('project_event_equipment')
          .delete()
          .eq('event_id', eventId);

        if (deleteError) throw deleteError;

        const { error: insertError } = await supabase
          .from('project_event_equipment')
          .insert(eventEquipment);

        if (insertError) throw insertError;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['project-event-equipment', eventId] }),
        queryClient.invalidateQueries({ queryKey: ['events', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['calendar-events', projectId] })
      ]);

      toast.success('Equipment list synchronized successfully');
    } catch (error) {
      console.error('Error syncing equipment:', error);
      toast.error('Failed to sync equipment list');
    }
  };

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>;

    if (needsEquipment) {
      checkEquipmentStatus();

      channel = supabase
        .channel(`event-equipment-${eventId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'project_event_equipment',
          filter: `event_id=eq.${eventId}`
        }, (payload) => {
          console.log('Received real-time update:', payload);
          checkEquipmentStatus();
          queryClient.invalidateQueries({ queryKey: ['project-event-equipment', eventId] });
        })
        .subscribe((status) => {
          console.log(`Subscription status for event ${eventId}:`, status);
        });
    }

    return () => {
      if (channel) {
        console.log(`Unsubscribing from event ${eventId}`);
        channel.unsubscribe();
      }
    };
  }, [eventId, needsEquipment, queryClient]);

  if (!needsEquipment) return null;

  return (
    <div className="h-10 w-10 flex items-center justify-center">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleEquipmentSync}
        className={isSynced ? 'text-green-500' : 'text-blue-500'}
      >
        <Package className="h-6 w-6" />
      </Button>
    </div>
  );
}