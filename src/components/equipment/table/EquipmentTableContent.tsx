import React from "react";
import { TableBody } from "@/components/ui/table";
import { Equipment } from "@/types/equipment";
import { EquipmentTableGroup } from "./EquipmentTableGroup";
import { useFolderStructure } from "@/hooks/useFolderStructure";

interface EquipmentTableContentProps {
  equipment: Equipment[];
  selectedItems: string[];
  onItemSelect: (id: string) => void;
}

export function EquipmentTableContent({
  equipment,
  selectedItems,
  onItemSelect,
}: EquipmentTableContentProps) {
  const { getFolderName, getFolderSortOrder, groupEquipmentByFolder } = useFolderStructure();

  const groupedEquipment = groupEquipmentByFolder(equipment);
  const sortedFolderNames = Object.keys(groupedEquipment).sort((a, b) => {
    const itemA = equipment.find(item => getFolderName(item.folder_id) === a);
    const itemB = equipment.find(item => getFolderName(item.folder_id) === b);
    return getFolderSortOrder(itemA?.folder_id).localeCompare(getFolderSortOrder(itemB?.folder_id));
  });

  return (
    <TableBody>
      {sortedFolderNames.map((folderName) => (
        <EquipmentTableGroup
          key={folderName}
          folderName={folderName}
          equipment={groupedEquipment[folderName]}
          selectedItems={selectedItems}
          onItemSelect={onItemSelect}
        />
      ))}
    </TableBody>
  );
}