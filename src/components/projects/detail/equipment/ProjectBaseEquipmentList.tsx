import { ScrollArea } from "@/components/ui/scroll-area";
import { useProjectEquipment } from "@/hooks/useProjectEquipment";
import { useEquipmentGroups } from "@/hooks/useEquipmentGroups";
import { useEquipmentDragDrop } from "@/hooks/useEquipmentDragDrop";
import { EquipmentGroup } from "./components/EquipmentGroup";
import { GroupDialogs } from "./components/GroupDialogs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRef, useState } from "react";

interface ProjectBaseEquipmentListProps {
  projectId: string;
  selectedGroupId: string | null;
  onGroupSelect: (groupId: string | null) => void;
}

export function ProjectBaseEquipmentList({ 
  projectId, 
  selectedGroupId,
  onGroupSelect,
}: ProjectBaseEquipmentListProps) {
  const { equipment = [], removeEquipment } = useProjectEquipment(projectId);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [pendingDropData, setPendingDropData] = useState<string | null>(null);
  
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
  } = useEquipmentGroups(projectId);

  const {
    lastAddedItemId,
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
    }
  });

  // Group equipment by group_id
  const groupedEquipment = equipment.reduce((acc, item) => {
    const groupId = item.group_id || 'ungrouped';
    if (!acc[groupId]) acc[groupId] = [];
    acc[groupId].push(item);
    return acc;
  }, {} as Record<string, typeof equipment>);

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
    }
    setPendingDropData(null);
  };

  return (
    <ScrollArea 
      ref={scrollAreaRef}
      className="h-full"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (data) {
          setPendingDropData(data);
          setShowNewGroupDialog(true);
        }
      }}
    >
      <div className="space-y-6 pr-4">
        {groups.map(group => (
          <EquipmentGroup
            key={group.id}
            id={group.id}
            name={group.name}
            equipment={groupedEquipment[group.id] || []}
            isSelected={selectedGroupId === group.id}
            totalPrice={group.total_price || 0}
            onSelect={() => onGroupSelect(group.id === selectedGroupId ? null : group.id)}
            onDelete={() => handleGroupDelete(group.id)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, group.id)}
            onRemoveEquipment={removeEquipment}
          />
        ))}
      </div>

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
    </ScrollArea>
  );
}