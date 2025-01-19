import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { BaseEquipmentIcon } from "./equipment/BaseEquipmentIcon";
import { EquipmentDifferenceDialog } from "./equipment/EquipmentDifferenceDialog";
import { useSyncEquipment } from "./equipment/useSyncEquipment";

interface Equipment {
  name: string;
  code: string;
}

interface EquipmentGroup {
  name: string;
}

interface EquipmentItem {
  id: string;
  equipment: Equipment;
  quantity: number;
  group: EquipmentGroup;
}

interface EquipmentChange {
  item: EquipmentItem;
  oldQuantity: number;
  newQuantity: number;
}

interface EquipmentDifference {
  added: EquipmentItem[];
  removed: EquipmentItem[];
  changed: EquipmentChange[];
}

interface EquipmentIconProps {
  isEditingDisabled: boolean;
  sectionTitle?: string;
  isSynced: boolean;
  isChecking: boolean;
  eventId: string;
  projectId: string;
  hasProjectEquipment: boolean;
}

export function EquipmentIcon({
  isEditingDisabled,
  isSynced,
  isChecking,
  eventId,
  projectId,
  hasProjectEquipment
}: EquipmentIconProps) {
  const [showDifferences, setShowDifferences] = useState(false);
  const [differences, setDifferences] = useState<EquipmentDifference>({
    added: [],
    removed: [],
    changed: []
  });

  const { handleSync } = useSyncEquipment(projectId, eventId);

  const fetchDifferences = async () => {
    try {
      const { data: projectEquipment } = await supabase
        .from('project_equipment')
        .select(`
          equipment_id,
          quantity,
          group_id,
          equipment:equipment (
            name,
            code
          ),
          group:project_equipment_groups (
            name
          )
        `)
        .eq('project_id', projectId);

      const { data: eventEquipment } = await supabase
        .from('project_event_equipment')
        .select(`
          equipment_id,
          quantity,
          group_id,
          equipment:equipment (
            name,
            code
          ),
          group:project_equipment_groups (
            name
          )
        `)
        .eq('event_id', eventId);

      const projectMap = new Map(projectEquipment?.map(item => [item.equipment_id, item]) || []);
      const eventMap = new Map(eventEquipment?.map(item => [item.equipment_id, item]) || []);

      const added: EquipmentItem[] = [];
      const removed: EquipmentItem[] = [];
      const changed: EquipmentChange[] = [];

      projectMap.forEach((projectItem, equipId) => {
        const eventItem = eventMap.get(equipId);
        
        if (!eventItem) {
          added.push({
            id: equipId,
            equipment: projectItem.equipment,
            quantity: projectItem.quantity,
            group: projectItem.group
          });
        } else if (eventItem.quantity !== projectItem.quantity) {
          changed.push({
            item: {
              id: equipId,
              equipment: projectItem.equipment,
              quantity: eventItem.quantity,
              group: projectItem.group
            },
            oldQuantity: eventItem.quantity,
            newQuantity: projectItem.quantity
          });
        }
      });

      eventMap.forEach((eventItem, equipId) => {
        if (!projectMap.has(equipId)) {
          removed.push({
            id: equipId,
            equipment: eventItem.equipment,
            quantity: eventItem.quantity,
            group: eventItem.group
          });
        }
      });

      setDifferences({ added, removed, changed });
    } catch (error) {
      console.error('Error fetching differences:', error);
      toast.error("Failed to fetch equipment differences");
    }
  };

  const handleViewDifferences = () => {
    setShowDifferences(true);
    fetchDifferences();
  };

  return (
    <>
      <BaseEquipmentIcon
        isSynced={isSynced}
        isDisabled={isEditingDisabled || isChecking}
        onViewDifferences={handleViewDifferences}
        onSync={handleSync}
        hasProjectEquipment={hasProjectEquipment}
      />

      <EquipmentDifferenceDialog
        isOpen={showDifferences}
        onOpenChange={setShowDifferences}
        equipmentDifference={differences}
      />
    </>
  );
}