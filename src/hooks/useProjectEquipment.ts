import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types/equipment";
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

  const addEquipment = async (item: Equipment, groupId: string | null = null) => {
    setLoading(true);
    try {
      // Check if the equipment exists in the project
      let query = supabase
        .from('project_equipment')
        .select('*')
        .eq('project_id', projectId)
        .eq('equipment_id', item.id);
      
      // Only add group_id to query if it's not null
      if (groupId !== null) {
        query = query.eq('group_id', groupId);
      } else {
        query = query.is('group_id', null);
      }

      const { data: existingEquipment, error: queryError } = await query.maybeSingle();

      if (queryError) throw queryError;

      if (existingEquipment) {
        // If it exists, update the quantity
        const { error: updateError } = await supabase
          .from('project_equipment')
          .update({
            quantity: existingEquipment.quantity + 1
          })
          .eq('id', existingEquipment.id);

        if (updateError) throw updateError;
        toast.success('Equipment quantity updated');
      } else {
        // If it doesn't exist, create a new entry
        const { error: insertError } = await supabase
          .from('project_equipment')
          .insert({
            project_id: projectId,
            equipment_id: item.id,
            quantity: 1,
            group_id: groupId
          });

        if (insertError) throw insertError;
        toast.success('Equipment added to project');
      }

      // Invalidate relevant queries to update UI and sync status
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['project-equipment', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['sync-status'] })
      ]);
    } catch (error: any) {
      console.error('Error adding equipment:', error);
      toast.error(error.message || 'Failed to add equipment');
    } finally {
      setLoading(false);
    }
  };

  const removeEquipment = async (id: string) => {
    // Optimistically update the UI
    const previousEquipment = equipment;
    queryClient.setQueryData(['project-equipment', projectId], 
      equipment.filter(item => item.id !== id)
    );

    try {
      const { error } = await supabase
        .from('project_equipment')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Invalidate sync status queries to update event icons
      await queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      
      toast.success('Equipment removed from project');
    } catch (error: any) {
      // Revert to previous state if there's an error
      console.error('Error removing equipment:', error);
      queryClient.setQueryData(['project-equipment', projectId], previousEquipment);
      toast.error(error.message || 'Failed to remove equipment');
    }
  };

  return {
    equipment,
    loading: loading || isLoadingEquipment,
    addEquipment,
    removeEquipment
  };
}