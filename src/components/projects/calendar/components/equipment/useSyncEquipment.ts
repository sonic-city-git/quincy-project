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

      try {
        // Get existing event equipment
        const { data: eventEquipment } = await supabase
          .from('project_event_equipment')
          .select('equipment_id, id')
          .eq('event_id', eventId);

        // Create maps for easier lookup
        const projectEquipMap = new Map(
          projectEquipment.map(item => [item.equipment_id, item])
        );
        const eventEquipMap = new Map(
          eventEquipment?.map(item => [item.equipment_id, item]) || []
        );

        // Update existing equipment
        for (const [equipId, projectItem] of projectEquipMap.entries()) {
          if (eventEquipMap.has(equipId)) {
            const { error: updateError } = await supabase
              .from('project_event_equipment')
              .update({
                quantity: projectItem.quantity,
                group_id: projectItem.group_id,
                is_synced: true
              })
              .eq('event_id', eventId)
              .eq('equipment_id', equipId);

            if (updateError) {
              console.error('Error updating equipment:', updateError);
              throw updateError;
            }
          } else {
            // Insert new equipment
            const { error: insertError } = await supabase
              .from('project_event_equipment')
              .insert({
                project_id: projectId,
                event_id: eventId,
                equipment_id: projectItem.equipment_id,
                quantity: projectItem.quantity,
                group_id: projectItem.group_id,
                is_synced: true
              });

            if (insertError) {
              console.error('Error inserting new equipment:', insertError);
              throw insertError;
            }
          }
        }

        // Remove equipment that no longer exists in project
        const equipmentToRemove = Array.from(eventEquipMap.keys())
          .filter(equipId => !projectEquipMap.has(equipId));

        if (equipmentToRemove.length > 0) {
          const { error: deleteError } = await supabase
            .from('project_event_equipment')
            .delete()
            .eq('event_id', eventId)
            .in('equipment_id', equipmentToRemove);

          if (deleteError) {
            console.error('Error removing old equipment:', deleteError);
            throw deleteError;
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
    } catch (error) {
      console.error('Error in handleSync:', error);
      toast.error("Failed to sync equipment");
    }
  };

  return { handleSync };
}