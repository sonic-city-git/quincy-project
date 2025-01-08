import { useState, useEffect } from "react";
import { Equipment, SerialNumber } from "@/types/equipment";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useEquipmentData() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchEquipment = async () => {
    try {
      setIsLoading(true);
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select('*, equipment_serial_numbers(*)');

      if (equipmentError) {
        console.error('Error fetching equipment:', equipmentError);
        toast({
          title: "Error",
          description: "Failed to load equipment data",
          variant: "destructive",
        });
        return;
      }

      const formattedEquipment: Equipment[] = equipmentData.map(item => ({
        id: item.id,
        code: item.Code || '',
        name: item.Name || '',
        price: item.Price?.toString() || '0',
        value: item["Book Value"]?.toString() || '0',
        weight: item.Weight?.toString() || '0',
        stock: item.Stock || 0,
        folder_id: item.folder_id || undefined,
        Folder: item.Folder || undefined,
        serialNumbers: item.equipment_serial_numbers?.map((sn: any) => ({
          number: sn.serial_number,
          status: sn.status || "Available",
          notes: sn.notes
        })) || [],
      }));

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

  const handleAddEquipment = async (newEquipment: Equipment) => {
    try {
      // First, insert the equipment
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .insert([{
          id: newEquipment.id,
          Code: newEquipment.code,
          Name: newEquipment.name,
          Price: parseFloat(newEquipment.price),
          "Book Value": parseFloat(newEquipment.value),
          Weight: parseFloat(newEquipment.weight),
          Stock: newEquipment.stock,
          folder_id: newEquipment.folder_id,
        }])
        .select()
        .single();

      if (equipmentError) throw equipmentError;

      // Then, insert the serial numbers
      if (newEquipment.serialNumbers && newEquipment.serialNumbers.length > 0) {
        const { error: serialNumberError } = await supabase
          .from('equipment_serial_numbers')
          .insert(
            newEquipment.serialNumbers.map(sn => ({
              equipment_id: equipmentData.id,
              serial_number: sn.number,
              status: sn.status,
              notes: sn.notes
            }))
          );

        if (serialNumberError) throw serialNumberError;
      }

      toast({
        title: "Equipment added",
        description: "New equipment has been added successfully",
      });
      
      fetchEquipment();
    } catch (error) {
      console.error('Error adding equipment:', error);
      toast({
        title: "Error",
        description: "Failed to add equipment",
        variant: "destructive",
      });
    }
  };

  const handleEditEquipment = async (editedEquipment: Equipment) => {
    try {
      // Update equipment details
      const { error: equipmentError } = await supabase
        .from('equipment')
        .update({
          Code: editedEquipment.code,
          Name: editedEquipment.name,
          Price: parseFloat(editedEquipment.price),
          "Book Value": parseFloat(editedEquipment.value),
          Weight: parseFloat(editedEquipment.weight),
          Stock: editedEquipment.stock,
          folder_id: editedEquipment.folder_id,
        })
        .eq('id', editedEquipment.id);

      if (equipmentError) throw equipmentError;

      // Delete existing serial numbers
      const { error: deleteError } = await supabase
        .from('equipment_serial_numbers')
        .delete()
        .eq('equipment_id', editedEquipment.id);

      if (deleteError) throw deleteError;

      // Insert new serial numbers
      if (editedEquipment.serialNumbers && editedEquipment.serialNumbers.length > 0) {
        const { error: serialNumberError } = await supabase
          .from('equipment_serial_numbers')
          .insert(
            editedEquipment.serialNumbers.map(sn => ({
              equipment_id: editedEquipment.id,
              serial_number: sn.number,
              status: sn.status,
              notes: sn.notes
            }))
          );

        if (serialNumberError) throw serialNumberError;
      }

      toast({
        title: "Equipment updated",
        description: "Equipment has been updated successfully",
      });
      
      fetchEquipment();
    } catch (error) {
      console.error('Error updating equipment:', error);
      toast({
        title: "Error",
        description: "Failed to update equipment",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEquipment = async (selectedItems: string[]) => {
    try {
      // First delete serial numbers (due to foreign key constraint)
      const { error: serialNumberError } = await supabase
        .from('equipment_serial_numbers')
        .delete()
        .in('equipment_id', selectedItems);

      if (serialNumberError) throw serialNumberError;

      // Then delete equipment
      const { error: equipmentError } = await supabase
        .from('equipment')
        .delete()
        .in('id', selectedItems);

      if (equipmentError) throw equipmentError;

      toast({
        title: "Equipment deleted",
        description: `${selectedItems.length} equipment item(s) have been removed`,
      });
      
      fetchEquipment();
    } catch (error) {
      console.error('Error deleting equipment:', error);
      toast({
        title: "Error",
        description: "Failed to delete equipment",
        variant: "destructive",
      });
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
    handleAddEquipment,
    handleEditEquipment,
    handleDeleteEquipment,
    refetchEquipment: fetchEquipment,
  };
}