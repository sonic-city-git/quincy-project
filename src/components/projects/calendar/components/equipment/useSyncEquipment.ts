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

      // First delete existing event equipment that's no longer in the project
      const { error: deleteError } = await supabase
        .from('project_event_equipment')
        .delete()
        .eq('event_id', eventId)
        .not('equipment_id', 'in', projectEquipment.map(e => e.equipment_id));

      if (deleteError) throw deleteError;

      // Then upsert the current project equipment
      const { error: upsertError } = await supabase
        .from('project_event_equipment')
        .upsert(
          projectEquipment.map(item => ({
            project_id: projectId,
            event_id: eventId,
            equipment_id: item.equipment_id,
            quantity: item.quantity,
            group_id: item.group_id,
            is_synced: true
          })),
          {
            onConflict: 'event_id,equipment_id',
            ignoreDuplicates: false // We want to update existing entries
          }
        );

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