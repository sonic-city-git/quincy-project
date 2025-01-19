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
        // Check for existing equipment records
        const { data: existingEquipment } = await supabase
          .from('project_event_equipment')
          .select('equipment_id')
          .eq('event_id', eventId);

        // Delete existing equipment if any exists
        if (existingEquipment && existingEquipment.length > 0) {
          const { error: deleteError } = await supabase
            .from('project_event_equipment')
            .delete()
            .eq('event_id', eventId);

          if (deleteError) {
            console.error('Error deleting existing event equipment:', deleteError);
            throw deleteError;
          }

          console.log('Deleted existing event equipment');
        }

        // Prepare the equipment records for insertion
        const equipmentRecords = projectEquipment.map(item => ({
          project_id: projectId,
          event_id: eventId,
          equipment_id: item.equipment_id,
          quantity: item.quantity,
          group_id: item.group_id,
          is_synced: true
        }));

        // Insert all equipment records in a single operation
        const { error: insertError } = await supabase
          .from('project_event_equipment')
          .insert(equipmentRecords)
          .select();

        if (insertError) {
          console.error('Error inserting equipment records:', insertError);
          throw insertError;
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