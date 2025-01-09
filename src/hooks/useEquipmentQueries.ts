import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useEquipmentQueries() {
  return useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          *,
          equipment_serial_numbers (*)
        `);

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        code: item.code,
        name: item.name,
        daily_rate: item.daily_rate,
        manual_stock: item.manual_stock,
        stock_type: item.stock_type,
        folder_id: item.folder_id,
        metadata: item.metadata,
        category_id: item.category_id,
        created_at: item.created_at,
        equipment_serial_numbers: item.equipment_serial_numbers
      }));
    }
  });
}