import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useSyncEquipment(projectId: string, eventId: string) {
  const queryClient = useQueryClient();

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

      // Get current event equipment to find what needs to be deleted
      const { data: currentEventEquipment } = await supabase
        .from('project_event_equipment')
        .select('equipment_id, group_id')
        .eq('event_id', eventId);

      // Delete equipment that's no longer in the project
      if (currentEventEquipment && currentEventEquipment.length > 0) {
        // Create a unique identifier for each equipment-group combination in the project
        const projectEquipmentKeys = new Set(
          projectEquipment.map(item => `${item.equipment_id}-${item.group_id || 'null'}`)
        );

        // Find equipment to delete (in event but not in project)
        const toDelete = currentEventEquipment.filter(item => 
          !projectEquipmentKeys.has(`${item.equipment_id}-${item.group_id || 'null'}`)
        );

        // Delete equipment items one by one
        for (const item of toDelete) {
          const { error: deleteError } = await supabase
            .from('project_event_equipment')
            .delete()
            .eq('event_id', eventId)
            .eq('equipment_id', item.equipment_id)
            .eq('group_id', item.group_id);

          if (deleteError) {
            console.error('Error deleting equipment:', deleteError);
            throw deleteError;
          }
        }
      }

      // Insert or update project equipment one by one
      for (const item of projectEquipment) {
        const { error: upsertError } = await supabase
          .from('project_event_equipment')
          .upsert(
            {
              project_id: projectId,
              event_id: eventId,
              equipment_id: item.equipment_id,
              quantity: item.quantity,
              group_id: item.group_id,
              is_synced: true
            },
            {
              onConflict: 'event_id,equipment_id,group_id'
            }
          );

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