// Unified Variant Data Hook
// Provides consolidated data access for variant resources when both crew and equipment are needed

import { useVariantEquipment } from './useVariantEquipment';
import { useVariantCrew } from './useVariantCrew';

/**
 * Unified hook that combines equipment and crew data for variant operations
 * Use this when you need both types of resources in a single component
 * For focused operations, use useVariantEquipment or useVariantCrew directly
 */
export function useVariantData(projectId: string, variantName: string) {
  const equipmentHook = useVariantEquipment(projectId, variantName);
  const crewHook = useVariantCrew(projectId, variantName);

  // Combined loading state
  const isLoading = equipmentHook.isLoading || crewHook.isLoading;

  // Combined error state  
  const error = equipmentHook.error || crewHook.error;

  // Calculate total stats
  const totalEquipmentValue = equipmentHook.equipmentData
    ? [...equipmentHook.equipmentData.equipment_groups, { equipment_items: equipmentHook.equipmentData.equipment_ungrouped }]
        .reduce((total, group) => {
          return total + group.equipment_items.reduce((groupTotal, item) => {
            return groupTotal + (item.equipment?.rental_price || 0) * item.quantity;
          }, 0);
        }, 0)
    : 0;

  const totalEquipmentItems = equipmentHook.equipmentData
    ? (equipmentHook.equipmentData.equipment_groups || []).reduce((total, group) => 
        total + group.equipment_items.length, 0
      ) + (equipmentHook.equipmentData.equipment_ungrouped || []).length
    : 0;

  const totalCrewRoles = crewHook.crewRoles.length;

  // Combined invalidation
  const invalidateAll = async () => {
    await Promise.all([
      equipmentHook.invalidateEquipmentCache(),
      crewHook.invalidateCrewCache()
    ]);
  };

  return {
    // Combined data
    equipmentData: equipmentHook.equipmentData,
    crewRoles: crewHook.crewRoles,
    
    // Combined states
    isLoading,
    error,
    
    // Combined stats
    totalEquipmentValue,
    totalEquipmentItems,
    totalCrewRoles,
    
    // Individual hook operations (pass-through)
    equipment: {
      addItem: equipmentHook.addEquipmentItem,
      removeItem: equipmentHook.removeEquipmentItem,
      createGroup: equipmentHook.createGroup,
      deleteGroup: equipmentHook.deleteGroup,
      handleCreateGroup: equipmentHook.handleCreateGroup,
      handleDeleteGroup: equipmentHook.handleDeleteGroup,
      
      // Group management state
      groupToDelete: equipmentHook.groupToDelete,
      targetGroupId: equipmentHook.targetGroupId,
      showNewGroupDialog: equipmentHook.showNewGroupDialog,
      newGroupName: equipmentHook.newGroupName,
      isGroupLoading: equipmentHook.isGroupLoading,
      
      // Group management actions
      setGroupToDelete: equipmentHook.setGroupToDelete,
      setTargetGroupId: equipmentHook.setTargetGroupId,
      setShowNewGroupDialog: equipmentHook.setShowNewGroupDialog,
      setNewGroupName: equipmentHook.setNewGroupName
    },
    
    crew: {
      addRole: crewHook.addCrewRole,
      updateRole: crewHook.updateCrewRole,
      removeRole: crewHook.removeCrewRole
    },
    
    // Combined cache management
    invalidateAll
  };
}