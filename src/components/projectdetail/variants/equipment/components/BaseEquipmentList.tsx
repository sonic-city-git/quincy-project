import { useProjectEquipment } from "@/hooks/useProjectEquipment";
import { useEquipmentDragDrop } from "@/hooks/useEquipmentDragDrop";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GroupDialogs } from "./GroupDialogs";
import { EmptyDropZone } from "./EmptyDropZone";
import { GroupList } from "./GroupList";
import { useGroupManagement } from "../hooks/useGroupManagement";

interface BaseEquipmentListProps {
  projectId: string;
  selectedGroupId: string | null;
  onGroupSelect: (groupId: string | null) => void;
}

export function BaseEquipmentList({ 
  projectId, 
  selectedGroupId,
  onGroupSelect,
}: BaseEquipmentListProps) {
  const { equipment = [], removeEquipment } = useProjectEquipment(projectId);
  const [pendingDropData, setPendingDropData] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  const {
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
  } = useGroupManagement(projectId);

  const {
    handleDrop,
    handleDragOver,
    handleDragLeave
  } = useEquipmentDragDrop(projectId);

  const { data: groups = [] } = useQuery({
    queryKey: ['project-equipment-groups', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_equipment_groups')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order');

      if (error) throw error;
      return data;
    },
    enabled: !!projectId
  });

  // Memoize grouped equipment for performance
  const groupedEquipment = useMemo(() => {
    return equipment.reduce((acc, item) => {
      const groupId = item.group_id || 'ungrouped';
      if (!acc[groupId]) acc[groupId] = [];
      acc[groupId].push(item);
      return acc;
    }, {} as Record<string, typeof equipment>);
  }, [equipment]);

  const handleGroupDelete = async (groupId: string) => {
    const groupEquipment = groupedEquipment[groupId] || [];
    if (groupEquipment.length === 0) {
      await handleDeleteGroup(groupId);
    } else {
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
        onRemoveEquipment={removeEquipment}
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
            setGroupToDelete(null);
            setTargetGroupId("");
          }
        }}
        onConfirmCreate={handleCreateGroupWithEquipment}
      />
    </EmptyDropZone>
  );
}