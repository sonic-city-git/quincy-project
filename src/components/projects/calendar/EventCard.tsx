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

  const checkEquipmentStatus = async () => {
    if (!event.type.needs_equipment) return;
    
    try {
      const { data: eventEquipment } = await supabase
        .from('project_event_equipment')
        .select('is_synced')
        .eq('event_id', event.id);

      const syncStatus = eventEquipment?.every(item => item.is_synced) ?? true;
      setIsSynced(syncStatus);
      console.log('Equipment sync status updated:', { eventId: event.id, syncStatus });
    } catch (error) {
      console.error('Error checking equipment status:', error);
      setIsSynced(true);
    }
  };

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>;

    if (event.type.needs_equipment) {
      checkEquipmentStatus();

      channel = supabase
        .channel(`event-equipment-${event.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'project_event_equipment',
          filter: `event_id=eq.${event.id}`
        }, (payload) => {
          console.log('Received real-time update:', payload);
          checkEquipmentStatus();
          queryClient.invalidateQueries({ queryKey: ['project-event-equipment', event.id] });
        })
        .subscribe((status) => {
          console.log(`Subscription status for event ${event.id}:`, status);
        });
    }

    return () => {
      if (channel) {
        console.log(`Unsubscribing from event ${event.id}`);
        channel.unsubscribe();
      }
    };
  }, [event.id, event.type.needs_equipment, queryClient]);

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

  const formatPrice = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "-";
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <>
      <Card 
        key={`${event.date}-${event.name}`} 
        className={`p-4 transition-colors ${getStatusBackground(event.status)}`}
      >
        <div className="grid grid-cols-[100px_minmax(100px,200px)_30px_30px_1fr_100px_40px_40px] gap-0 items-center">
          <EventHeader event={event} />
          
          <div className="flex items-center justify-center">
            {event.type.needs_equipment && (
              <div className="h-6 w-6 flex items-center justify-center -ml-8">
                <EquipmentIcon
                  isSynced={isSynced}
                  isEditingDisabled={isEditingDisabled(event.status)}
                  onViewEquipment={viewOutOfSyncEquipment}
                  onSyncEquipment={handleEquipmentOption}
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-center">
            {event.type.needs_crew && (
              <div className="h-6 w-6 flex items-center justify-center -ml-6">
                <Users className={isEditingDisabled(event.status) ? 'text-green-500' : 'text-muted-foreground'} />
              </div>
            )}
          </div>

          <div className="flex items-center ml-5">
            <span 
              className={`text-sm px-2 py-1 rounded-md ${EVENT_COLORS[event.type.name]}`}
            >
              {event.type.name}
            </span>
          </div>

          <div className="flex items-center justify-end text-sm font-medium">
            {formatPrice(event.revenue)}
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