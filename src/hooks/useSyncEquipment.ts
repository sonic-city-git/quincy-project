import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useSyncEquipment(projectId: string, eventId: string) {
  const queryClient = useQueryClient();

  const handleSync = async () => {
    try {
      // Get project equipment
      const { data: projectEquipment, error: projectError } = await supabase
        .from('project_equipment')
        .select('equipment_id, quantity, group_id')
        .eq('project_id', projectId);

      if (projectError) {
        console.error('Error fetching project equipment:', projectError);
        throw projectError;
      }

      if (!projectEquipment) {
        toast.error("No equipment found in project");
        return;
      }

      // Get current event equipment to find what needs to be deleted
      const { data: currentEventEquipment, error: eventError } = await supabase
        .from('project_event_equipment')
        .select('id, equipment_id, group_id')
        .eq('event_id', eventId);

      if (eventError) {
        console.error('Error fetching event equipment:', eventError);
        throw eventError;
      }

      // Create a map of existing event equipment for easy lookup
      const eventEquipmentMap = new Map(
        currentEventEquipment?.map(item => [
          `${item.equipment_id}-${item.group_id || 'null'}`,
          item
        ]) || []
      );

      // Create a map of project equipment
      const projectEquipmentMap = new Map(
        projectEquipment.map(item => [
          `${item.equipment_id}-${item.group_id || 'null'}`,
          item
        ])
      );

      // Delete equipment that's no longer in the project
      for (const [key, eventItem] of eventEquipmentMap) {
        if (!projectEquipmentMap.has(key)) {
          const { error: deleteError } = await supabase
            .from('project_event_equipment')
            .delete()
            .eq('id', eventItem.id);

          if (deleteError) {
            console.error('Error deleting equipment:', deleteError);
            throw deleteError;
          }
        }
      }

      // Update or insert project equipment one by one
      for (const [key, projectItem] of projectEquipmentMap) {
        const eventItem = eventEquipmentMap.get(key);
        
        // If item exists in event and has same quantity, skip it
        if (eventItem && currentEventEquipment?.find(e => 
          e.equipment_id === projectItem.equipment_id && 
          e.group_id === projectItem.group_id
        )) {
          continue;
        }

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

        if (upsertError) {
          console.error('Error upserting equipment:', upsertError);
          throw upsertError;
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