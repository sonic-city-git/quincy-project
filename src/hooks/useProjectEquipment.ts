import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/integrations/supabase/types/equipment";
import { toast } from "sonner";

export function useProjectEquipment(projectId: string) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const { data: equipment = [], isLoading: isLoadingEquipment } = useQuery({
    queryKey: ['project-equipment', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_equipment')
        .select(`
          *,
          equipment (
            id,
            name,
            code,
            rental_price
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        equipment_id: item.equipment_id,
        name: item.equipment.name,
        code: item.equipment.code,
        quantity: item.quantity,
        rental_price: item.equipment.rental_price,
        group_id: item.group_id
      }));
    },
    enabled: !!projectId
  });

  const addEquipment = async (item: Equipment) => {
    setLoading(true);
    try {
      // First check if the equipment already exists in the project
      const { data: existingEquipment } = await supabase
        .from('project_equipment')
        .select('*')
        .eq('project_id', projectId)
        .eq('equipment_id', item.id)
        .single();

      if (existingEquipment) {
        // If it exists, update the quantity
        const { error: updateError } = await supabase
          .from('project_equipment')
          .update({ quantity: existingEquipment.quantity + 1 })
          .eq('id', existingEquipment.id);

        if (updateError) throw updateError;
        toast.success('Equipment quantity updated');
      } else {
        // If it doesn't exist, create a new record
        const { error } = await supabase
          .from('project_equipment')
          .insert({
            project_id: projectId,
            equipment_id: item.id,
            quantity: 1
          });

        if (error) throw error;
        toast.success('Equipment added to project');
      }

      queryClient.invalidateQueries({ queryKey: ['project-equipment', projectId] });
    } catch (error) {
      console.error('Error adding equipment:', error);
      toast.error('Failed to add equipment');
    } finally {
      setLoading(false);
    }
  };

  const removeEquipment = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('project_equipment')
        .delete()
        .eq('id', id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['project-equipment', projectId] });
      toast.success('Equipment removed from project');
    } catch (error) {
      console.error('Error removing equipment:', error);
      toast.error('Failed to remove equipment');
    } finally {
      setLoading(false);
    }
  };

  return {
    equipment,
    loading: loading || isLoadingEquipment,
    addEquipment,
    removeEquipment
  };
}