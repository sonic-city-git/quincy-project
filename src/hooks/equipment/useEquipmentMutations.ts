import { Equipment, SerialNumber } from "@/types/equipment";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useEquipmentMutations() {
  const { toast } = useToast();

  const handleAddEquipment = async (newEquipment: Equipment) => {
    try {
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .insert([{
          code: newEquipment.code,
          name: newEquipment.name,
          daily_rate: parseFloat(newEquipment.price),
          manual_stock: newEquipment.stock,
          stock_type: newEquipment.stockCalculationMethod,
          folder_id: newEquipment.folder_id,
          metadata: {
            price: newEquipment.price,
            value: newEquipment.value,
            weight: newEquipment.weight,
            notes: newEquipment.notes
          }
        }])
        .select()
        .single();

      if (equipmentError) throw equipmentError;

      // Then, insert the serial numbers if using serial number calculation
      if (newEquipment.stockCalculationMethod === 'serial_numbers' && 
          newEquipment.serialNumbers && 
          newEquipment.serialNumbers.length > 0) {
        const { error: serialNumberError } = await supabase
          .from('equipment_serial_numbers')
          .insert(
            newEquipment.serialNumbers.map(sn => ({
              equipment_id: equipmentData.id, // Use the generated UUID
              serial_number: sn.number,
              status: 'Available', // Default status
              notes: sn.notes
            }))
          );

        if (serialNumberError) throw serialNumberError;
      }

      toast({
        title: "Equipment added",
        description: "New equipment has been added successfully",
      });
      
      return true;
    } catch (error) {
      console.error('Error adding equipment:', error);
      toast({
        title: "Error",
        description: "Failed to add equipment",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleEditEquipment = async (editedEquipment: Equipment) => {
    try {
      // Update equipment details
      const { error: equipmentError } = await supabase
        .from('equipment')
        .update({
          code: editedEquipment.code,
          name: editedEquipment.name,
          daily_rate: parseFloat(editedEquipment.price),
          manual_stock: editedEquipment.stock,
          stock_type: editedEquipment.stockCalculationMethod,
          folder_id: editedEquipment.folder_id,
          metadata: {
            price: editedEquipment.price,
            value: editedEquipment.value,
            weight: editedEquipment.weight,
            notes: editedEquipment.notes
          }
        })
        .eq('id', editedEquipment.id);

      if (equipmentError) throw equipmentError;

      // Delete existing serial numbers
      const { error: deleteError } = await supabase
        .from('equipment_serial_numbers')
        .delete()
        .eq('equipment_id', editedEquipment.id);

      if (deleteError) throw deleteError;

      // Insert new serial numbers if using serial number calculation
      if (editedEquipment.stockCalculationMethod === 'serial_numbers' && 
          editedEquipment.serialNumbers && 
          editedEquipment.serialNumbers.length > 0) {
        const { error: serialNumberError } = await supabase
          .from('equipment_serial_numbers')
          .insert(
            editedEquipment.serialNumbers.map(sn => ({
              equipment_id: editedEquipment.id,
              serial_number: sn.number,
              status: 'Available',
              notes: sn.notes
            }))
          );

        if (serialNumberError) throw serialNumberError;
      }

      toast({
        title: "Equipment updated",
        description: "Equipment has been updated successfully",
      });
      
      return true;
    } catch (error) {
      console.error('Error updating equipment:', error);
      toast({
        title: "Error",
        description: "Failed to update equipment",
        variant: "destructive",
      });
      return false;
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
      
      return true;
    } catch (error) {
      console.error('Error deleting equipment:', error);
      toast({
        title: "Error",
        description: "Failed to delete equipment",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    handleAddEquipment,
    handleEditEquipment,
    handleDeleteEquipment,
  };
}
