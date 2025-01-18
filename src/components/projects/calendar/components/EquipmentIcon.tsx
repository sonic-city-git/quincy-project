import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { EquipmentDialog } from "./EquipmentDialog";

interface EquipmentIconProps {
  isEditingDisabled: boolean;
  sectionTitle?: string;
  isSynced: boolean;
  isChecking: boolean;
  eventId: string;
  projectId: string;
}

export function EquipmentIcon({
  isEditingDisabled,
  sectionTitle,
  isSynced,
  isChecking,
  eventId,
  projectId
}: EquipmentIconProps) {
  const queryClient = useQueryClient();
  const [showDifferences, setShowDifferences] = useState(false);
  const [differences, setDifferences] = useState({
    added: [],
    removed: [],
    changed: []
  });

  useEffect(() => {
    const fetchDifferences = async () => {
      if (!showDifferences) return;

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

        const added = [];
        const removed = [];
        const changed = [];

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

    fetchDifferences();
  }, [showDifferences, eventId, projectId]);

  const handleSync = async () => {
    try {
      // Get project equipment
      const { data: projectEquipment } = await supabase
        .from('project_equipment')
        .select('equipment_id, quantity, group_id')
        .eq('project_id', projectId);

      if (!projectEquipment) {
        toast.error("No equipment found in project");
        return;
      }

      // Delete existing event equipment
      await supabase
        .from('project_event_equipment')
        .delete()
        .eq('event_id', eventId);

      // Insert new event equipment
      const { error: insertError } = await supabase
        .from('project_event_equipment')
        .insert(
          projectEquipment.map(item => ({
            project_id: projectId,
            event_id: eventId,
            equipment_id: item.equipment_id,
            quantity: item.quantity,
            group_id: item.group_id,
            is_synced: true
          }))
        );

      if (insertError) throw insertError;

      toast.success("Equipment synced successfully");
      
      // Invalidate relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['project-event-equipment', eventId] })
      ]);
    } catch (error) {
      console.error('Error syncing equipment:', error);
      toast.error("Failed to sync equipment");
    }
  };

  const getIconColor = () => {
    if (isChecking) return "text-muted-foreground animate-pulse";
    if (isSynced) return "text-green-500";
    return "text-blue-500";
  };

  const getTooltipText = () => {
    if (isChecking) return "Checking sync status...";
    if (isSynced) return "Equipment is NSYNC";
    return "Equipment out of sync";
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
                <Package className={getIconColor()} />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {getTooltipText()}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 p-0"
                  disabled={isEditingDisabled || isChecking}
                >
                  <Package className={getIconColor()} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onSelect={() => setShowDifferences(true)}>
                  View differences
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleSync}>
                  Sync equipment
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipTrigger>
          <TooltipContent>
            {getTooltipText()}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <EquipmentDialog
        isOpen={showDifferences}
        onOpenChange={setShowDifferences}
        equipmentDifference={differences}
      />
    </>
  );
}