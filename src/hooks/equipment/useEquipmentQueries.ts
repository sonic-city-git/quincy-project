import { useState, useEffect } from "react";
import { Equipment } from "@/types/equipment";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useEquipmentQueries() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchEquipment = async () => {
    try {
      setIsLoading(true);
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select(`
          *,
          equipment_serial_numbers (
            serial_number,
            status,
            notes
          )
        `);

      if (equipmentError) {
        console.error('Error fetching equipment:', equipmentError);
        toast({
          title: "Error",
          description: "Failed to load equipment data",
          variant: "destructive",
        });
        return;
      }

      console.log('Raw equipment data:', equipmentData);

      const formattedEquipment: Equipment[] = equipmentData.map(item => {
        const stockCalculationMethod = item["Stock calculation method"]?.toLowerCase();
        const isSerialNumberBased = stockCalculationMethod === "serial_numbers";
        
        console.log(`Equipment ${item.Name}:`, {
          stockCalculationMethod,
          isSerialNumberBased,
          serialNumbers: item.equipment_serial_numbers
        });

        return {
          id: item.id,
          code: item.Code || '',
          name: item.Name || '',
          price: item.Price?.toString() || '0',
          value: item["Book Value"]?.toString() || '0',
          weight: item.Weight?.toString() || '0',
          stock: isSerialNumberBased
            ? (item.equipment_serial_numbers?.length || 0)
            : (item.Stock || 0),
          folder_id: item.folder_id || undefined,
          Folder: item.Folder || undefined,
          notes: item.Notes || undefined,
          stockCalculationMethod: isSerialNumberBased ? "serial_numbers" : "manual",
          serialNumbers: item.equipment_serial_numbers?.map((sn: any) => ({
            number: sn.serial_number,
            status: sn.status || "Available",
            notes: sn.notes
          })) || [],
        };
      });

      console.log('Formatted equipment:', formattedEquipment);
      setEquipment(formattedEquipment);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();

    const channel = supabase
      .channel('equipment_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipment'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          fetchEquipment();
          toast({
            title: "Equipment Updated",
            description: "The equipment list has been updated",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    equipment,
    isLoading,
    refetchEquipment: fetchEquipment,
  };
}