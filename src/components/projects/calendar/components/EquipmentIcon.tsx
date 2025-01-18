import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { EquipmentDifferenceDialog } from "./equipment/EquipmentDifferenceDialog";
import { EquipmentSyncMenu } from "./equipment/EquipmentSyncMenu";
import { useSyncEquipment } from "./equipment/useSyncEquipment";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EquipmentIconProps {
  isEditingDisabled: boolean;
  sectionTitle?: string;
  isSynced: boolean;
  isChecking: boolean;
  eventId: string;
  projectId: string;
}

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

export function EquipmentIcon({
  isEditingDisabled,
  isSynced,
  isChecking,
  eventId,
  projectId
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
      // Get project equipment
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

      // Get event equipment
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

      // Find added and changed items
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

      // Find removed items
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

  if (isSynced) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 p-0"
                disabled={true}
              >
                <Package className="text-green-500" />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            Equipment is NSYNC
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      <EquipmentSyncMenu
        isEditingDisabled={isEditingDisabled}
        isChecking={isChecking}
        isSynced={isSynced}
        onViewDifferences={handleViewDifferences}
        onSync={handleSync}
      />

      <EquipmentDifferenceDialog
        isOpen={showDifferences}
        onOpenChange={setShowDifferences}
        equipmentDifference={differences}
      />
    </>
  );
}