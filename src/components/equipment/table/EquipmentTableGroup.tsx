import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Equipment } from "@/types/equipment";
import { EquipmentTableRow } from "./EquipmentTableRow";

interface EquipmentTableGroupProps {
  folderName: string;
  equipment: Equipment[];
  selectedItems: string[];
  onItemSelect: (id: string) => void;
}

export function EquipmentTableGroup({
  folderName,
  equipment,
  selectedItems,
  onItemSelect,
}: EquipmentTableGroupProps) {
  return (
    <React.Fragment>
      <TableRow className="bg-zinc-900/50">
        <TableCell colSpan={7} className="py-2">
          <h3 className="text-sm font-semibold text-zinc-200">{folderName}</h3>
        </TableCell>
      </TableRow>
      {equipment
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((item) => (
          <EquipmentTableRow
            key={item.id}
            item={item}
            isSelected={selectedItems.includes(item.id)}
            onItemSelect={onItemSelect}
          />
        ))}
    </React.Fragment>
  );
}