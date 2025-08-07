import { VariantEquipmentGroup, VariantEquipmentItem } from "@/types/variants";
import { useEquipmentDragDrop } from "@/hooks/useEquipmentDragDrop";
import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GroupDialogs } from "./GroupDialogs";
import { EmptyDropZone } from "./EmptyDropZone";
import { GroupList } from "./GroupList";
import { useVariantEquipment } from "@/hooks/useVariantEquipment";

interface BaseEquipmentListProps {
  projectId: string;
  variantName: string;
  selectedGroupId: string | null;
  onGroupSelect: (groupId: string | null) => void;
  equipmentGroups: VariantEquipmentGroup[];
  ungroupedEquipment: VariantEquipmentItem[];
  isLoading: boolean;
  compact?: boolean; // NEW: Support for compact layout
}

export function BaseEquipmentList({ 
  projectId, 
  variantName,
  selectedGroupId,
  onGroupSelect,
  equipmentGroups,
  ungroupedEquipment,
  isLoading,
  compact = false
}: BaseEquipmentListProps) {
  const [pendingDropData, setPendingDropData] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  const {
    removeEquipmentItem,
    groupToDelete,
    setGroupToDelete,
    targetGroupId,
    setTargetGroupId,
    showNewGroupDialog,
    setShowNewGroupDialog,
    newGroupName,
    setNewGroupName,
    handleCreateGroup,
    handleDeleteGroup
  } = useVariantEquipment(projectId, variantName);

  const {
    handleDrop,
    handleDragOver,
    handleDragLeave
  } = useEquipmentDragDrop(projectId);

  // Use the passed equipment groups instead of fetching all project equipment groups
  const groups = equipmentGroups;

  // Memoize grouped equipment for performance and transform data structure
  const groupedEquipment = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    
    // Helper function to transform VariantEquipmentItem to ProjectEquipment format
    const transformEquipmentItem = (item: VariantEquipmentItem) => ({
      id: item.id,
      equipment_id: item.equipment_id,
      name: item.equipment.name,
      code: item.equipment.code || null,
      quantity: item.quantity,
      rental_price: item.equipment.rental_price || null,
      group_id: item.group_id
    });
    
    // Add equipment from groups
    equipmentGroups.forEach(group => {
      grouped[group.id] = group.equipment_items.map(transformEquipmentItem);
    });
    
    // Add ungrouped equipment
    if (ungroupedEquipment.length > 0) {
      grouped['ungrouped'] = ungroupedEquipment.map(transformEquipmentItem);
    }
    
    return grouped;
  }, [equipmentGroups, ungroupedEquipment]);

  const handleGroupDelete = async (groupId: string) => {
    const groupEquipment = groupedEquipment[groupId] || [];
    
    if (groupEquipment.length === 0) {
      // No equipment - delete directly
      await handleDeleteGroup(groupId);
    } else {
      // Has equipment - show dialog for user choice
      setGroupToDelete(groupId);
    }
  };

  const handleCreateGroupWithEquipment = async () => {
    if (!pendingDropData) return;
    
    const newGroupId = await handleCreateGroup();
    if (newGroupId) {
      const dropEvent = {
        preventDefault: () => {},
        stopPropagation: () => {},
        currentTarget: null,
        dataTransfer: {
          getData: () => pendingDropData
        }
      } as unknown as React.DragEvent;
      
      await handleDrop(dropEvent, newGroupId.id);
      await queryClient.invalidateQueries({ queryKey: ['project-equipment-groups', projectId] });
    }
    setPendingDropData(null);
  };

  return (
    <EmptyDropZone
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const data = e.dataTransfer.getData('application/json');
        if (data) {
          setPendingDropData(data);
          setShowNewGroupDialog(true);
        }
      }}
    >
      <GroupList
        groups={groups}
        groupedEquipment={groupedEquipment}
        selectedGroupId={selectedGroupId}
        onGroupSelect={onGroupSelect}
        onGroupDelete={handleGroupDelete}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onRemoveEquipment={removeEquipmentItem}
        compact={compact}
      />

      <GroupDialogs
        groups={groups}
        showDeleteDialog={!!groupToDelete}
        showNewGroupDialog={showNewGroupDialog}
        groupToDelete={groupToDelete}
        targetGroupId={targetGroupId}
        newGroupName={newGroupName}
        onDeleteDialogClose={() => {
          setGroupToDelete(null);
          setTargetGroupId("");
        }}
        onNewGroupDialogClose={() => {
          setShowNewGroupDialog(false);
          setNewGroupName("");
          setPendingDropData(null);
        }}
        onTargetGroupSelect={setTargetGroupId}
        onNewGroupNameChange={setNewGroupName}
                  onConfirmDelete={async () => {
            if (groupToDelete) {
              await handleDeleteGroup(groupToDelete);
              // State cleanup is handled by the useVariantEquipment hook
            }
          }}
        onConfirmCreate={handleCreateGroupWithEquipment}
      />
    </EmptyDropZone>
  );
}