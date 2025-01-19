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
        .select(`
          equipment_id,
          quantity,
          group_id
        `)
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

      // Process each equipment item individually to avoid conflicts
      for (const item of projectEquipment) {
        try {
          const { error: upsertError } = await supabase
            .from('project_event_equipment')
            .upsert({
              project_id: projectId,
              event_id: eventId,
              equipment_id: item.equipment_id,
              quantity: item.quantity,
              group_id: item.group_id,
              is_synced: true
            }, {
              onConflict: 'event_id,equipment_id'
            });

          if (upsertError) {
            console.error('Error upserting equipment item:', upsertError);
            throw upsertError;
          }
        } catch (itemError) {
          console.error('Error processing equipment item:', itemError);
          throw itemError;
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