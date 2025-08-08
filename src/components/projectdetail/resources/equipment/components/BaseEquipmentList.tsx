import { VariantEquipmentGroup, VariantEquipmentItem } from "@/types/variants";
import { useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GroupDialogs } from "./GroupDialogs";
import { EmptyDropZone } from "./EmptyDropZone";
import { GroupList } from "./GroupList";
import { useVariantEquipment } from "@/hooks/useVariantEquipment";
import { toast } from "sonner";

interface BaseEquipmentListProps {
  projectId: string;
  variantId: string;
  variantName: string;
  selectedGroupId: string | null;
  onGroupSelect: (groupId: string | null) => void;
  equipmentGroups: VariantEquipmentGroup[];
  ungroupedEquipment: VariantEquipmentItem[];
  isLoading: boolean;
  compact?: boolean; // NEW: Support for compact layout
  scrollToItemId?: string; // ID of item to scroll to
}

export function BaseEquipmentList({ 
  projectId,
  variantId,
  variantName,
  selectedGroupId,
  onGroupSelect,
  equipmentGroups,
  ungroupedEquipment,
  isLoading,
  compact = false,
  scrollToItemId: externalScrollToItemId
}: BaseEquipmentListProps) {
  const [pendingDropData, setPendingDropData] = useState<string | null>(null);
  const [scrollToItemId, setScrollToItemId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  const {
    addEquipmentItem,
    removeEquipmentItem,
    updateEquipmentItem,
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
  } = useVariantEquipment(projectId, variantId);

  // Variant-specific drag/drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    if (target?.classList) {
      target.classList.add('bg-primary/5', 'border-primary/20');
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    if (target?.classList) {
      target.classList.remove('bg-primary/5', 'border-primary/20');
    }
  }, []);

  // Quantity update handler
  const handleUpdateQuantity = useCallback(async (itemId: string, quantity: number) => {
    await updateEquipmentItem({ itemId, quantity });
  }, [updateEquipmentItem]);

  const handleDrop = useCallback(async (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    if (target?.classList) {
      target.classList.remove('bg-primary/5', 'border-primary/20');
    }

    try {
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      const item = JSON.parse(data);
      
      // Add equipment - server will handle duplicates automatically
      const result = await addEquipmentItem({
        equipment_id: item.id,
        group_id: groupId,
        quantity: 1,
        notes: '',
        // Pass equipment info for optimistic update
        _equipmentInfo: {
          name: item.name,
          rental_price: item.rental_price || null,
          code: item.code || null,
          folder_id: item.folder_id || null
        }
      });
      
      // Show appropriate success message based on what happened
      if (result._wasOrphaned) {
        toast.success(`Fixed orphaned ${item.name} and updated quantity to ${result.quantity}`);
      } else if (result._wasUpdated) {
        toast.success(`Increased ${item.name} quantity to ${result.quantity}`);
      } else {
        toast.success(`Added ${item.name} to group`);
      }
      
      // Scroll to the added/updated item
      if (result.id) {
        setScrollToItemId(result.id);
        // Clear scroll target after a delay
        setTimeout(() => setScrollToItemId(null), 1000);
      }
    } catch (error) {
      console.error('Error adding equipment to variant:', error);
      toast.error('Failed to add equipment to variant');
    }
  }, [addEquipmentItem, equipmentGroups]);

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
      group_id: item.group_id,
      folder_id: item.equipment.folder_id // Include folder_id for sub-grouping
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
        onUpdateQuantity={handleUpdateQuantity}
        compact={compact}
        scrollToItemId={externalScrollToItemId || scrollToItemId}
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