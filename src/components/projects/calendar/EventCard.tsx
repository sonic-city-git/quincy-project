import { CalendarEvent } from "@/types/events";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";
import { EVENT_COLORS } from "@/constants/eventColors";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import { EquipmentIcon } from "./components/EquipmentIcon";
import { EquipmentDialog } from "./components/EquipmentDialog";
import { EventHeader } from "./components/EventHeader";
import { EventActions } from "./components/EventActions";

interface EquipmentItem {
  id: string;
  quantity: number;
  equipment: {
    name: string;
    code: string | null;
  };
  group: {
    name: string;
  } | null;
}

interface EquipmentDifference {
  added: EquipmentItem[];
  removed: EquipmentItem[];
  changed: {
    item: EquipmentItem;
    oldQuantity: number;
    newQuantity: number;
  }[];
}

interface EventCardProps {
  event: CalendarEvent;
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit?: (event: CalendarEvent) => void;
}

export function EventCard({ event, onStatusChange, onEdit }: EventCardProps) {
  const [isSynced, setIsSynced] = useState(true);
  const [hasEventEquipment, setHasEventEquipment] = useState(false);
  const [hasProjectEquipment, setHasProjectEquipment] = useState(false);
  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false);
  const [equipmentDifference, setEquipmentDifference] = useState<EquipmentDifference>({
    added: [],
    removed: [],
    changed: []
  });
  const queryClient = useQueryClient();

  const isEditingDisabled = (status: CalendarEvent['status']) => {
    return ['cancelled', 'invoice ready'].includes(status);
  };

  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'proposed':
      case 'confirmed':
      case 'invoice ready':
      case 'cancelled':
        return 'bg-zinc-800/45 hover:bg-zinc-800/50';
      default:
        return 'hover:bg-zinc-800/50';
    }
  };

  useEffect(() => {
    let isSubscribed = true;

    const fetchStatus = async () => {
      if (!isSubscribed) return;

      try {
        console.log('Fetching equipment status for event:', event.id);
        
        // Check project equipment
        const { data: projectEquipment } = await supabase
          .from('project_equipment')
          .select('id')
          .eq('project_id', event.project_id)
          .limit(1);
        
        if (isSubscribed) {
          const hasProject = !!projectEquipment?.length;
          console.log('Project equipment status:', { hasProject });
          setHasProjectEquipment(hasProject);
        }

        // Check event equipment and sync status
        const { data: eventEquipment, error } = await supabase
          .from('project_event_equipment')
          .select('*')
          .eq('event_id', event.id);

        if (!error && isSubscribed) {
          const hasEquipment = eventEquipment && eventEquipment.length > 0;
          const syncStatus = hasEquipment ? eventEquipment.every(item => item.is_synced) : true;
          
          console.log('Event equipment status:', {
            eventId: event.id,
            hasEquipment,
            syncStatus,
            items: eventEquipment
          });
          
          setHasEventEquipment(hasEquipment);
          setIsSynced(syncStatus);
        } else if (error) {
          console.error('Error fetching equipment status:', error);
          if (isSubscribed) {
            setHasEventEquipment(false);
            setIsSynced(true);
          }
        }
      } catch (error) {
        console.error('Error in fetchStatus:', error);
        if (isSubscribed) {
          setHasEventEquipment(false);
          setIsSynced(true);
        }
      }
    };

    if (event.type.needs_equipment) {
      console.log('Initial fetch for event:', event.id);
      fetchStatus();
    }

    const channel = supabase
      .channel(`event-equipment-${event.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_event_equipment',
        filter: `event_id=eq.${event.id}`
      }, (payload) => {
        console.log('Received real-time update for event equipment:', {
          eventId: event.id,
          payload
        });
        if (isSubscribed) {
          fetchStatus();
          queryClient.invalidateQueries({ queryKey: ['project-event-equipment', event.id] });
        }
      })
      .subscribe();

    const projectChannel = supabase
      .channel(`project-equipment-${event.project_id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_equipment',
        filter: `project_id=eq.${event.project_id}`
      }, (payload) => {
        console.log('Received real-time update for project equipment:', {
          projectId: event.project_id,
          payload
        });
        if (isSubscribed) {
          fetchStatus();
          queryClient.invalidateQueries({ queryKey: ['project-equipment', event.project_id] });
        }
      })
      .subscribe();

    return () => {
      console.log('Cleaning up subscriptions for event:', event.id);
      isSubscribed = false;
      channel.unsubscribe();
      projectChannel.unsubscribe();
    };
  }, [event.id, event.project_id, event.type.needs_equipment, queryClient]);

  const handleEquipmentOption = async () => {
    try {
      const { data: projectEquipment, error: fetchError } = await supabase
        .from('project_equipment')
        .select('*')
        .eq('project_id', event.project_id);

      if (fetchError) throw fetchError;

      const { error: deleteError } = await supabase
        .from('project_event_equipment')
        .delete()
        .eq('event_id', event.id);

      if (deleteError) throw deleteError;

      if (projectEquipment && projectEquipment.length > 0) {
        const eventEquipment = projectEquipment.map(item => ({
          project_id: event.project_id,
          event_id: event.id,
          equipment_id: item.equipment_id,
          quantity: item.quantity,
          group_id: item.group_id,
          is_synced: true
        }));

        const { error: upsertError } = await supabase
          .from('project_event_equipment')
          .upsert(eventEquipment);

        if (upsertError) throw upsertError;
      }

      setIsSynced(true);
      setHasEventEquipment(projectEquipment && projectEquipment.length > 0);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['project-event-equipment', event.id] }),
        queryClient.invalidateQueries({ queryKey: ['events', event.project_id] }),
        queryClient.invalidateQueries({ queryKey: ['calendar-events', event.project_id] })
      ]);

      console.log('Equipment sync completed successfully for event:', event.id);
      toast.success('Equipment list synchronized successfully');
    } catch (error) {
      console.error('Error syncing equipment:', error);
      toast.error('Failed to sync equipment list');
    }
  };

  const viewOutOfSyncEquipment = async () => {
    try {
      console.log('Fetching equipment differences...');
      
      const { data: projectEquipment, error: projectError } = await supabase
        .from('project_equipment')
        .select(`
          id,
          quantity,
          equipment:equipment_id (
            name,
            code
          ),
          group:group_id (
            name
          )
        `)
        .eq('project_id', event.project_id);

      if (projectError) throw projectError;

      const { data: eventEquipment, error: eventError } = await supabase
        .from('project_event_equipment')
        .select(`
          id,
          quantity,
          equipment:equipment_id (
            name,
            code
          ),
          group:group_id (
            name
          )
        `)
        .eq('event_id', event.id);

      if (eventError) throw eventError;

      console.log('Project equipment:', projectEquipment);
      console.log('Event equipment:', eventEquipment);

      const added: EquipmentItem[] = [];
      const removed: EquipmentItem[] = [];
      const changed: EquipmentDifference['changed'] = [];

      const projectMap = new Map(projectEquipment?.map(item => [item.equipment.name, item]) || []);
      const eventMap = new Map(eventEquipment?.map(item => [item.equipment.name, item]) || []);

      projectEquipment?.forEach(projectItem => {
        const eventItem = eventMap.get(projectItem.equipment.name);
        
        if (!eventItem) {
          console.log('Added new:', projectItem.equipment.name, {
            quantity: projectItem.quantity
          });
          added.push(projectItem as EquipmentItem);
        } else if (eventItem.quantity !== projectItem.quantity) {
          console.log('Changed:', projectItem.equipment.name, {
            oldQty: eventItem.quantity,
            newQty: projectItem.quantity
          });
          changed.push({
            item: projectItem as EquipmentItem,
            oldQuantity: eventItem.quantity,
            newQuantity: projectItem.quantity
          });
        }
      });

      eventEquipment?.forEach(eventItem => {
        const projectItem = projectMap.get(eventItem.equipment.name);
        
        if (!projectItem) {
          console.log('Removed:', eventItem.equipment.name, {
            quantity: eventItem.quantity
          });
          removed.push(eventItem as EquipmentItem);
        }
      });

      console.log('Differences found:', { added, removed, changed });

      setEquipmentDifference({ added, removed, changed });
      setIsEquipmentDialogOpen(true);

      if (added.length === 0 && removed.length === 0 && changed.length === 0) {
        toast.info('No differences found in equipment lists');
      }
    } catch (error) {
      console.error('Error fetching equipment differences:', error);
      toast.error('Failed to fetch equipment differences');
    }
  };

  return (
    <>
      <Card 
        key={`${event.date}-${event.name}`} 
        className={`p-4 transition-colors ${getStatusBackground(event.status)}`}
      >
        <div className="grid grid-cols-[120px_1fr_40px_40px_1fr_auto] gap-4">
          <EventHeader event={event} />
          
          <div className="flex items-center justify-center">
            {event.type.needs_equipment && (
              <EquipmentIcon
                hasEventEquipment={hasEventEquipment}
                isSynced={isSynced}
                isEditingDisabled={isEditingDisabled(event.status)}
                onViewEquipment={viewOutOfSyncEquipment}
                onSyncEquipment={handleEquipmentOption}
              />
            )}
          </div>

          <div className="flex items-center justify-center">
            {event.type.needs_crew && (
              <Users className={`h-6 w-6 ${isEditingDisabled(event.status) ? 'text-green-500' : 'text-muted-foreground'}`} />
            )}
          </div>

          <div className="flex items-center">
            <span 
              className={`text-sm px-2 py-1 rounded-md ${EVENT_COLORS[event.type.name]}`}
            >
              {event.type.name}
            </span>
          </div>

          <EventActions
            event={event}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
            isEditingDisabled={isEditingDisabled(event.status)}
          />
        </div>
      </Card>

      <EquipmentDialog
        isOpen={isEquipmentDialogOpen}
        onOpenChange={setIsEquipmentDialogOpen}
        equipmentDifference={equipmentDifference}
      />
    </>
  );
}