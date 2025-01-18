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

  return { handleSync };
}