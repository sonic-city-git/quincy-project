import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Equipment } from "@/types/equipment";
import { EQUIPMENT_FOLDERS, flattenFolders } from "@/data/equipmentFolders";

interface EquipmentTableProps {
  equipment: Equipment[];
  selectedItems: string[];
  onSelectAll: () => void;
  onItemSelect: (id: string) => void;
}

export function EquipmentTable({ equipment, selectedItems, onSelectAll, onItemSelect }: EquipmentTableProps) {
  const allFolders = flattenFolders(EQUIPMENT_FOLDERS);

  const getFolderName = (folder_id: string | undefined): string => {
    const folder = allFolders.find(f => f.id === folder_id);
    return folder?.name || 'Uncategorized';
  };

  const groupedEquipment = equipment.reduce((acc, item) => {
    const folderName = getFolderName(item.folder_id);
    if (!acc[folderName]) {
      acc[folderName] = [];
    }
    acc[folderName].push(item);
    return acc;
  }, {} as Record<string, Equipment[]>);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={selectedItems.length === equipment.length && equipment.length > 0}
                onCheckedChange={onSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(groupedEquipment).sort(([a], [b]) => a.localeCompare(b)).map(([folderName, items]) => (
            <React.Fragment key={folderName}>
              <TableRow className="bg-zinc-900/50">
                <TableCell colSpan={5} className="py-2">
                  <h3 className="text-sm font-semibold text-zinc-200">{folderName}</h3>
                </TableCell>
              </TableRow>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="w-[50px]">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => onItemSelect(item.id)}
                      aria-label={`Select ${item.name}`}
                    />
                  </TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.stock}</TableCell>
                  <TableCell>{item.price}</TableCell>
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}