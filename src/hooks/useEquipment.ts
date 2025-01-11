import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export function useEquipment() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipment'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['equipment'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: equipment = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      try {
        console.log('Fetching equipment...');
        
        const { data: equipmentData, error: equipmentError } = await supabase
          .from('equipment')
          .select(`
            *,
            equipment_serial_numbers (
              id,
              equipment_id,
              serial_number,
              status,
              notes,
              created_at,
              updated_at
            )
          `)
          .order('name');

        if (equipmentError) {
          console.error('Error fetching equipment:', equipmentError);
          toast.error("Failed to fetch equipment");
          throw equipmentError;
        }

        return equipmentData || [];
      } catch (error) {
        console.error('Error in equipment query:', error);
        toast.error("Failed to fetch equipment");
        throw error;
      }
    },
    refetchOnMount: true,
    retry: 1
  });

  return { equipment, loading, refetch };
}