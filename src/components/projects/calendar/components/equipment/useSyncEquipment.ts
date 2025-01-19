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

      if (!projectEquipment?.length) {
        console.log('No equipment found in project');
        toast.error("No equipment found in project");
        return;
      }

      console.log('Fetched project equipment:', projectEquipment);

      try {
        // First delete all existing equipment for this event
        const { error: deleteError } = await supabase
          .from('project_event_equipment')
          .delete()
          .eq('event_id', eventId);

        if (deleteError) {
          console.error('Error deleting existing event equipment:', deleteError);
          throw deleteError;
        }

        console.log('Deleted existing event equipment');

        // Wait a moment to ensure delete is processed
        await new Promise(resolve => setTimeout(resolve, 500));

        // Now insert the new equipment records one by one to avoid conflicts
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

          if (insertError) {
            console.error('Error inserting equipment item:', item, insertError);
            throw insertError;
          }
        }

        console.log('Successfully inserted new event equipment');
        toast.success("Equipment synced successfully");
        
        // Invalidate relevant queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['events', projectId] }),
          queryClient.invalidateQueries({ queryKey: ['project-event-equipment', eventId] })
        ]);
      } catch (error) {
        console.error('Error syncing equipment:', error);
        toast.error("Failed to sync equipment");
        throw error;
      }
    } catch (error) {
      console.error('Error in handleSync:', error);
      toast.error("Failed to sync equipment");
    }
  };

  return { handleSync };
}