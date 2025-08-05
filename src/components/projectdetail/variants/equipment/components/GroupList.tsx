import React from "react";
import { EquipmentGroup } from "./EquipmentGroup";
import { ProjectEquipment } from "@/types/equipment";
import { SPACING, cn } from "@/design-system";

// Proper type definition for equipment group
interface EquipmentGroupData {
  id: string;
  name: string;
  total_price?: number;
}

interface GroupListProps {
  groups: EquipmentGroupData[];
  groupedEquipment: Record<string, ProjectEquipment[]>;
  selectedGroupId: string | null;
  onGroupSelect: (groupId: string | null) => void;
  onGroupDelete: (groupId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, groupId: string) => void;
  onRemoveEquipment: (id: string) => void;
  className?: string;
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
  className
}: GroupListProps) {
  return (
    <div 
      className={cn(SPACING.section, "pr-4", className)}
      role="list"
      aria-label={`Equipment groups (${groups.length} groups)`}
    >
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