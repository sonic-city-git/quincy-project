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

  const fetchEquipmentStatus = async () => {
    if (!event.type.needs_equipment) return;
    console.log('Fetching equipment status for event:', event.id);

    try {
      // Check project equipment
      const { data: projectEquipment } = await supabase
        .from('project_equipment')
        .select('id')
        .eq('project_id', event.project_id)
        .limit(1);
      
      setHasProjectEquipment(!!projectEquipment?.length);
      console.log('Project has equipment:', !!projectEquipment?.length);

      // Check event equipment and sync status
      const { data: eventEquipment, error } = await supabase
        .from('project_event_equipment')
        .select('*')
        .eq('event_id', event.id);

      if (!error) {
        const hasEquipment = eventEquipment && eventEquipment.length > 0;
        const syncStatus = hasEquipment ? eventEquipment.every(item => item.is_synced) : true;
        
        console.log('Event equipment status:', { hasEquipment, syncStatus });
        setHasEventEquipment(hasEquipment);
        setIsSynced(syncStatus);
      }
    } catch (error) {
      console.error('Error fetching equipment status:', error);
      setHasEventEquipment(false);
      setIsSynced(true);
    }
  };

  useEffect(() => {
    let projectChannel: ReturnType<typeof supabase.channel>;
    let eventChannel: ReturnType<typeof supabase.channel>;
    let equipmentChannel: ReturnType<typeof supabase.channel>;

    const setupSubscriptions = () => {
      console.log('Setting up subscriptions for event:', event.id);

      // Subscribe to project equipment changes
      projectChannel = supabase
        .channel(`project-equipment-${event.project_id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'project_equipment',
          filter: `project_id=eq.${event.project_id}`
        }, (payload) => {
          console.log('Project equipment changed:', payload);
          fetchEquipmentStatus();
          queryClient.invalidateQueries({ queryKey: ['project-equipment', event.project_id] });
        })
        .subscribe();

      // Subscribe to event equipment changes
      eventChannel = supabase
        .channel(`event-equipment-${event.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'project_event_equipment',
          filter: `event_id=eq.${event.id}`
        }, (payload) => {
          console.log('Event equipment changed:', payload);
          fetchEquipmentStatus();
          queryClient.invalidateQueries({ queryKey: ['project-event-equipment', event.id] });
        })
        .subscribe();

      // Subscribe to equipment changes
      equipmentChannel = supabase
        .channel(`equipment-changes`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'equipment'
        }, () => {
          console.log('Equipment table changed, refreshing status');
          fetchEquipmentStatus();
        })
        .subscribe();
    };

    if (event.type.needs_equipment) {
      fetchEquipmentStatus();
      setupSubscriptions();
    }

    return () => {
      if (projectChannel) projectChannel.unsubscribe();
      if (eventChannel) eventChannel.unsubscribe();
      if (equipmentChannel) equipmentChannel.unsubscribe();
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

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['project-event-equipment', event.id] }),
        queryClient.invalidateQueries({ queryKey: ['events', event.project_id] }),
        queryClient.invalidateQueries({ queryKey: ['calendar-events', event.project_id] })
      ]);

      toast.success('Equipment list synchronized successfully');
    } catch (error) {
      console.error('Error syncing equipment:', error);
      toast.error('Failed to sync equipment list');
    }
  };

  const viewOutOfSyncEquipment = async () => {
    try {
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

      const added: EquipmentItem[] = [];
      const removed: EquipmentItem[] = [];
      const changed: EquipmentDifference['changed'] = [];

      const projectMap = new Map(projectEquipment?.map(item => [item.equipment.name, item]) || []);
      const eventMap = new Map(eventEquipment?.map(item => [item.equipment.name, item]) || []);

      projectEquipment?.forEach(projectItem => {
        const eventItem = eventMap.get(projectItem.equipment.name);
        
        if (!eventItem) {
          added.push(projectItem as EquipmentItem);
        } else if (eventItem.quantity !== projectItem.quantity) {
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
          removed.push(eventItem as EquipmentItem);
        }
      });

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
