import { Table, TableBody } from "@/components/ui/table";
import { Equipment } from "@/types/equipment";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EquipmentTableHeader } from "./table/EquipmentTableHeader";
import { EquipmentTableRow } from "./table/EquipmentTableRow";

interface EquipmentTableProps {
  equipment: Equipment[];
  selectedItems: string[];
  onSelectAll: () => void;
  onItemSelect: (id: string) => void;
}

export function EquipmentTable({ 
  equipment, 
  selectedItems, 
  onSelectAll, 
  onItemSelect 
}: EquipmentTableProps) {
  const equipmentArray = Array.isArray(equipment) ? equipment : [];

  return (
    <ScrollArea className="h-[400px] w-full">
      <Table>
        <EquipmentTableHeader 
          equipment={equipmentArray}
          selectedItems={selectedItems}
          onSelectAll={onSelectAll}
        />
        <TableBody>
          {equipmentArray.map((item) => (
            <EquipmentTableRow
              key={item.id}
              item={item}
              isSelected={selectedItems.includes(item.id)}
              onItemSelect={onItemSelect}
            />
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}