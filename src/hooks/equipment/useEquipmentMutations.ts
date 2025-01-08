import { Equipment, SerialNumber } from "@/types/equipment";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useEquipmentMutations() {
  const { toast } = useToast();

  const handleAddEquipment = async (newEquipment: Equipment) => {
    try {
      // First, insert the equipment
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .insert([{
          // Remove the id field to let Supabase generate it
          Code: newEquipment.code,
          Name: newEquipment.name,
          Price: parseFloat(newEquipment.price),
          "Book Value": parseFloat(newEquipment.value),
          Weight: parseFloat(newEquipment.weight),
          Stock: newEquipment.stock,
          "Stock calculation method": newEquipment.stockCalculationMethod,
          folder_id: newEquipment.folder_id,
          Notes: newEquipment.notes,
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
          Code: editedEquipment.code,
          Name: editedEquipment.name,
          Price: parseFloat(editedEquipment.price),
          "Book Value": parseFloat(editedEquipment.value),
          Weight: parseFloat(editedEquipment.weight),
          Stock: editedEquipment.stock,
          "Stock calculation method": editedEquipment.stockCalculationMethod,
          folder_id: editedEquipment.folder_id,
          Notes: editedEquipment.notes,
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