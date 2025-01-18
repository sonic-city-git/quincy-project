import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useSyncEquipment(projectId: string, eventId: string) {
  const queryClient = useQueryClient();

  const handleSync = async () => {
    try {
      // First, get all project equipment with their groups
      const { data: projectEquipment } = await supabase
        .from('project_equipment')
        .select('equipment_id, quantity, group_id')
        .eq('project_id', projectId);

      if (!projectEquipment) {
        toast.error("No equipment found in project");
        return;
      }

      // Get current event equipment with their groups
      const { data: currentEventEquipment } = await supabase
        .from('project_event_equipment')
        .select('equipment_id, quantity, group_id')
        .eq('event_id', eventId);

      if (currentEventEquipment) {
        // Create a map of current event equipment for easy lookup
        const currentEquipmentMap = new Map(
          currentEventEquipment.map(item => [
            `${item.equipment_id}-${item.group_id || 'null'}`,
            item
          ])
        );

        // Create a map of project equipment for easy lookup
        const projectEquipmentMap = new Map(
          projectEquipment.map(item => [
            `${item.equipment_id}-${item.group_id || 'null'}`,
            item
          ])
        );

        // Find equipment to delete (in event but not in project)
        for (const [key, eventItem] of currentEquipmentMap.entries()) {
          if (!projectEquipmentMap.has(key)) {
            const { error: deleteError } = await supabase
              .from('project_event_equipment')
              .delete()
              .eq('event_id', eventId)
              .eq('equipment_id', eventItem.equipment_id)
              .eq('group_id', eventItem.group_id);

            if (deleteError) throw deleteError;
          }
        }

        // Update or insert equipment
        for (const [key, projectItem] of projectEquipmentMap.entries()) {
          const eventItem = currentEquipmentMap.get(key);
          
          // If quantities are different or item doesn't exist in event, upsert
          if (!eventItem || eventItem.quantity !== projectItem.quantity) {
            const { error: upsertError } = await supabase
              .from('project_event_equipment')
              .upsert({
                project_id: projectId,
                event_id: eventId,
                equipment_id: projectItem.equipment_id,
                quantity: projectItem.quantity,
                group_id: projectItem.group_id,
                is_synced: true
              });

            if (upsertError) throw upsertError;
          }
        }
      } else {
        // If no current event equipment exists, insert all project equipment
        for (const item of projectEquipment) {
          const { error: insertError } = await supabase
            .from('project_event_equipment')
            .insert({
              project_id: projectId,
              event_id: eventId,
              equipment_id: item.equipment_id,
              quantity: item.quantity,
              group_id: item.group_id,
              is_synced: true
            });

          if (insertError) throw insertError;
        }
      }

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

  return { handleSync };
}