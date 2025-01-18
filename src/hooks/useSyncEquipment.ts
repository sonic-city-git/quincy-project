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
        .select('equipment_id')
        .eq('event_id', eventId);

      if (currentEventEquipment) {
        const projectEquipmentIds = projectEquipment.map(e => e.equipment_id);
        const toDelete = currentEventEquipment
          .filter(e => !projectEquipmentIds.includes(e.equipment_id))
          .map(e => e.equipment_id);

        // Delete equipment that's no longer in the project
        if (toDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('project_event_equipment')
            .delete()
            .eq('event_id', eventId)
            .in('equipment_id', toDelete);

          if (deleteError) throw deleteError;
        }
      }

      // Create a Map to deduplicate equipment entries
      const uniqueEquipment = new Map();
      projectEquipment.forEach(item => {
        uniqueEquipment.set(item.equipment_id, {
          project_id: projectId,
          event_id: eventId,
          equipment_id: item.equipment_id,
          quantity: item.quantity,
          group_id: item.group_id,
          is_synced: true
        });
      });

      // Convert Map back to array for upsert
      const equipmentToUpsert = Array.from(uniqueEquipment.values());

      // Then upsert the current project equipment
      const { error: upsertError } = await supabase
        .from('project_event_equipment')
        .upsert(equipmentToUpsert, {
          onConflict: 'event_id,equipment_id',
          ignoreDuplicates: false // We want to update existing entries
        });

      if (upsertError) throw upsertError;

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