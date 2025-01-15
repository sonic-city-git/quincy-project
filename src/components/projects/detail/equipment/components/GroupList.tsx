import React from "react";
import { EquipmentGroup } from "./EquipmentGroup";
import { ProjectEquipment } from "@/types/equipment";

interface GroupListProps {
  groups: any[];
  groupedEquipment: Record<string, ProjectEquipment[]>;
  selectedGroupId: string | null;
  onGroupSelect: (groupId: string | null) => void;
  onGroupDelete: (groupId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, groupId: string) => void;
  onRemoveEquipment: (id: string) => void;
}

export function GroupList({
  groups,
  groupedEquipment,
  selectedGroupId,
  onGroupSelect,
  onGroupDelete,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemoveEquipment,
}: GroupListProps) {
  return (
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
          onDelete={() => onGroupDelete(group.id)}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, group.id)}
          onRemoveEquipment={onRemoveEquipment}
        />
      ))}
    </div>
  );
}