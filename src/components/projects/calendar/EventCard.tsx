import { CalendarEvent } from "@/types/events";
import { EVENT_COLORS } from "@/constants/eventColors";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import { EquipmentDialog } from "./components/EquipmentDialog";
import { EventActions } from "./components/EventActions";
import { Card } from "@/components/ui/card";
import { EventCard as EventCardContent } from "./components/EventCard";
import { EventCardIcons } from "./components/EventCardIcons";
import { formatPrice } from "@/utils/priceFormatters";
import { EventCardGrid } from "./components/EventCardGrid";

interface EventCardProps {
  event: CalendarEvent;
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit: (event: CalendarEvent) => void;
}

export function EventCard({ event, onStatusChange, onEdit }: EventCardProps) {
  const [isSynced, setIsSynced] = useState(true);
  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false);
  const [equipmentDifference, setEquipmentDifference] = useState({
    added: [],
    removed: [],
    changed: []
  });
  const queryClient = useQueryClient();

  const isEditingDisabled = (status: string) => {
    return ['cancelled', 'invoice ready'].includes(status);
  };

  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'proposed':
      case 'confirmed':
      case 'invoice ready':
      case 'cancelled':
        return 'bg-zinc-800/75 hover:bg-zinc-800/90';
      default:
        return 'hover:bg-zinc-800/90';
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
          project_id: event.project_id,
          event_id: event.id,
          equipment_id: item.equipment_id,
          quantity: item.quantity,
          group_id: item.group_id,
          is_synced: true
        }));

        const { error: deleteError } = await supabase
          .from('project_event_equipment')
          .delete()
          .eq('event_id', event.id);

        if (deleteError) throw deleteError;

        const { error: insertError } = await supabase
          .from('project_event_equipment')
          .insert(eventEquipment);

        if (insertError) throw insertError;
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

      const added = [];
      const removed = [];
      const changed = [];

      const projectMap = new Map(projectEquipment?.map(item => [item.equipment.name, item]) || []);
      const eventMap = new Map(eventEquipment?.map(item => [item.equipment.name, item]) || []);

      projectEquipment?.forEach(projectItem => {
        const eventItem = eventMap.get(projectItem.equipment.name);
        
        if (!eventItem) {
          added.push(projectItem);
        } else if (eventItem.quantity !== projectItem.quantity) {
          changed.push({
            item: projectItem,
            oldQuantity: eventItem.quantity,
            newQuantity: projectItem.quantity
          });
        }
      });

      eventEquipment?.forEach(eventItem => {
        const projectItem = projectMap.get(eventItem.equipment.name);
        
        if (!projectItem) {
          removed.push(eventItem);
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

  const handleEditClick = () => {
    if (!isEditingDisabled(event.status)) {
      onEdit(event);
    }
  };

  return (
    <>
      <Card 
        key={`${event.date}-${event.name}`} 
        className={`p-2 transition-colors mb-1.5 ${getStatusBackground(event.status)}`}
      >
        <EventCardGrid>
          <EventCardContent event={event} />
          
          <EventCardIcons
            event={event}
            isSynced={isSynced}
            isEditingDisabled={isEditingDisabled(event.status)}
            onViewEquipment={viewOutOfSyncEquipment}
            onSyncEquipment={handleEquipmentOption}
          />

          <div className="flex items-center px-1.5">
            <span 
              className={`text-sm px-1.5 py-0.5 rounded-md bg-opacity-75 ${EVENT_COLORS[event.type.name]}`}
            >
              {event.type.name}
            </span>
          </div>

          <div className="flex items-center justify-end text-sm">
            {formatPrice(event.revenue)}
          </div>

          <EventActions
            event={event}
            onStatusChange={onStatusChange}
            onEdit={handleEditClick}
            isEditingDisabled={isEditingDisabled(event.status)}
          />
        </EventCardGrid>
      </Card>

      <EquipmentDialog
        isOpen={isEquipmentDialogOpen}
        onOpenChange={setIsEquipmentDialogOpen}
        equipmentDifference={equipmentDifference}
      />
    </>
  );
}
