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
  compact?: boolean; // NEW: Support for compact layout
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
  className,
  compact = false
}: GroupListProps) {
  // Show empty state if no groups
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm font-medium">No equipment in this variant</p>
        <p className="text-xs mt-2 text-center max-w-xs">
          Drag equipment from the stock panel to this area to create your first group
        </p>
      </div>
    );
  }

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
          compact={compact}
        />
      ))}
    </div>
  );
}