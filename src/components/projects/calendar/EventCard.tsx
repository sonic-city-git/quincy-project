import { CalendarEvent } from "@/types/events";
import { EVENT_COLORS } from "@/constants/eventColors";
import { useState } from 'react';
import { EquipmentDialog } from "./components/EquipmentDialog";
import { EventActions } from "./components/EventActions";
import { Card } from "@/components/ui/card";
import { EventCard as EventCardContent } from "./components/EventCard";
import { EventCardIcons } from "./components/EventCardIcons";
import { formatPrice } from "@/utils/priceFormatters";
import { EventCardGrid } from "./components/EventCardGrid";
import { EventCardStatus } from "./components/EventCardStatus";
import { useEquipmentSync } from "./hooks/useEquipmentSync";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EventCardProps {
  event: CalendarEvent;
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit: (event: CalendarEvent) => void;
  sectionTitle?: string;
}

export function EventCard({ event, onStatusChange, onEdit, sectionTitle }: EventCardProps) {
  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false);
  const [equipmentDifference, setEquipmentDifference] = useState({
    added: [],
    removed: [],
    changed: []
  });

  const { isSynced, handleEquipmentSync } = useEquipmentSync(event);

  const isEditingDisabled = (status: string) => {
    return ['cancelled', 'invoice ready'].includes(status);
  };

  const viewOutOfSyncEquipment = async () => {
    try {
      const { data: outOfSyncEquipment, error: eventError } = await supabase
        .from('project_event_equipment')
        .select(`
          id,
          quantity,
          is_synced,
          equipment:equipment_id (
            name,
            code
          ),
          group:group_id (
            name
          )
        `)
        .eq('event_id', event.id)
        .eq('is_synced', false);

      if (eventError) throw eventError;

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

      const added = [];
      const removed = [];
      const changed = [];

      const projectMap = new Map(projectEquipment?.map(item => [item.equipment.name, item]) || []);
      const eventMap = new Map(outOfSyncEquipment?.map(item => [item.equipment.name, item]) || []);

      outOfSyncEquipment?.forEach(eventItem => {
        const projectItem = projectMap.get(eventItem.equipment.name);
        
        if (!projectItem) {
          removed.push(eventItem);
        } else if (projectItem.quantity !== eventItem.quantity) {
          changed.push({
            item: projectItem,
            oldQuantity: eventItem.quantity,
            newQuantity: projectItem.quantity
          });
        }
      });

      projectEquipment?.forEach(projectItem => {
        if (!eventMap.has(projectItem.equipment.name)) {
          added.push(projectItem);
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
        className={`p-2 transition-colors mb-1.5 ${EventCardStatus({ status: event.status })}`}
      >
        <EventCardGrid>
          <EventCardContent event={event} />
          
          <EventCardIcons
            event={event}
            isSynced={isSynced}
            isEditingDisabled={isEditingDisabled(event.status)}
            onViewEquipment={viewOutOfSyncEquipment}
            onSyncEquipment={handleEquipmentSync}
            sectionTitle={sectionTitle}
          />

          <div className="flex items-center px-1.5">
            <span 
              className={`text-sm px-1.5 py-0.5 rounded-md bg-opacity-75 ${EVENT_COLORS[event.type.name]}`}
            >
              {event.type.name}
            </span>
          </div>

          <div className="flex items-center justify-end text-sm">
            {formatPrice(event.total_price)}
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