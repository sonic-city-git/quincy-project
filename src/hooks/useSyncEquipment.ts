import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useSyncEquipment(projectId: string, eventId: string) {
  const queryClient = useQueryClient();

  const handleSync = async () => {
    try {
      console.log('Starting equipment sync for project:', projectId, 'event:', eventId);
      
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

      console.log('Fetched project equipment:', projectEquipment);

      // Get current event equipment
      const { data: currentEventEquipment, error: eventError } = await supabase
        .from('project_event_equipment')
        .select('id, equipment_id, quantity, group_id')
        .eq('event_id', eventId);

      if (eventError) {
        console.error('Error fetching event equipment:', eventError);
        throw eventError;
      }

      console.log('Fetched current event equipment:', currentEventEquipment);

      // First, delete all existing event equipment
      if (currentEventEquipment && currentEventEquipment.length > 0) {
        const { error: deleteError } = await supabase
          .from('project_event_equipment')
          .delete()
          .eq('event_id', eventId);

        if (deleteError) {
          console.error('Error deleting existing equipment:', deleteError);
          throw deleteError;
        }
        console.log('Deleted existing event equipment');
      }

      // Then insert all project equipment as new rows
      if (projectEquipment.length > 0) {
        const equipmentToInsert = projectEquipment.map(item => ({
          project_id: projectId,
          event_id: eventId,
          equipment_id: item.equipment_id,
          quantity: item.quantity,
          group_id: item.group_id,
          is_synced: true
        }));

        console.log('Inserting new equipment:', equipmentToInsert);

        const { error: insertError } = await supabase
          .from('project_event_equipment')
          .insert(equipmentToInsert);

        if (insertError) {
          console.error('Error inserting equipment:', insertError);
          throw insertError;
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