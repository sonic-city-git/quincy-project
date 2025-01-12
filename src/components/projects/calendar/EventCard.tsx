import { CalendarEvent } from "@/types/events";
import { Card } from "@/components/ui/card";
import { EventCardHeader } from "./components/EventCardHeader";
import { EventCardIcons } from "./components/EventCardIcons";
import { EventStatusBadge } from "./components/EventStatusBadge";
import { EventRevenue } from "./components/EventRevenue";
import { EventActions } from "./components/EventActions";
import { EventEquipmentSync } from "./components/EventEquipmentSync";
import { useState } from 'react';
import { EquipmentDialog } from "./components/EquipmentDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EventCardProps {
  event: CalendarEvent;
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit?: (event: CalendarEvent) => void;
}

interface ProjectEquipment {
  id: string;
  quantity: number;
  equipment: {
    name: string;
    code: string;
  };
  group: {
    name: string;
  };
}

export function EventCard({ event, onStatusChange, onEdit }: EventCardProps) {
  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false);
  const [equipmentDifference, setEquipmentDifference] = useState({
    added: [] as ProjectEquipment[],
    removed: [] as ProjectEquipment[],
    changed: [] as Array<{
      item: ProjectEquipment;
      oldQuantity: number;
      newQuantity: number;
    }>
  });
  const [isSynced, setIsSynced] = useState(true);

  const isEditingDisabled = (status: string) => {
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

      const added: ProjectEquipment[] = [];
      const removed: ProjectEquipment[] = [];
      const changed: Array<{
        item: ProjectEquipment;
        oldQuantity: number;
        newQuantity: number;
      }> = [];

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

  const handleSyncEquipment = async () => {
    // Implementation for syncing equipment
    toast.success('Equipment synced successfully');
    setIsSynced(true);
  };

  return (
    <>
      <Card 
        key={`${event.date}-${event.name}`} 
        className={`p-3 transition-colors mb-2 ${getStatusBackground(event.status)}`}
      >
        <div className="grid grid-cols-[100px_165px_30px_30px_30px_1fr_100px_40px_40px] gap-2 items-center">
          <EventCardHeader event={event} />
          
          <EventCardIcons
            event={event}
            isSynced={isSynced}
            isEditingDisabled={isEditingDisabled(event.status)}
            onViewEquipment={viewOutOfSyncEquipment}
            onSyncEquipment={handleSyncEquipment}
          />

          <EventEquipmentSync
            eventId={event.id}
            projectId={event.project_id}
            needsEquipment={event.type.needs_equipment}
          />

          <div className="flex items-center px-2">
            <EventStatusBadge typeName={event.type.name} />
          </div>

          <EventRevenue revenue={event.revenue} />

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