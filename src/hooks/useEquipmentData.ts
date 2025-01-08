import { useEquipmentMutations } from "./equipment/useEquipmentMutations";
import { useEquipmentQueries } from "./equipment/useEquipmentQueries";

export function useEquipmentData() {
  const { equipment, isLoading, refetchEquipment } = useEquipmentQueries();
  const { handleAddEquipment, handleEditEquipment, handleDeleteEquipment } = useEquipmentMutations();

  const wrappedHandleAddEquipment = async (...args: Parameters<typeof handleAddEquipment>) => {
    const success = await handleAddEquipment(...args);
    if (success) {
      refetchEquipment();
    }
  };

  const wrappedHandleEditEquipment = async (...args: Parameters<typeof handleEditEquipment>) => {
    const success = await handleEditEquipment(...args);
    if (success) {
      refetchEquipment();
    }
  };

  const wrappedHandleDeleteEquipment = async (...args: Parameters<typeof handleDeleteEquipment>) => {
    const success = await handleDeleteEquipment(...args);
    if (success) {
      refetchEquipment();
    }
  };

  return {
    equipment,
    isLoading,
    handleAddEquipment: wrappedHandleAddEquipment,
    handleEditEquipment: wrappedHandleEditEquipment,
    handleDeleteEquipment: wrappedHandleDeleteEquipment,
    refetchEquipment,
  };
}