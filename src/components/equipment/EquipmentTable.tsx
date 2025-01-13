import { Table, TableBody } from "@/components/ui/table";
import { EquipmentTableRow } from "./EquipmentTableRow";
import { EquipmentTableHeader } from "./EquipmentTableHeader";
import { Equipment } from "@/integrations/supabase/types/equipment";

interface EquipmentTableProps {
  equipment: Equipment[];
  selectedItem: string | null;
  onItemSelect: (id: string) => void;
}

export function EquipmentTable({ equipment, selectedItem, onItemSelect }: EquipmentTableProps) {
  return (
    <div className="relative">
      <Table>
        <EquipmentTableHeader />
        <TableBody>
          {equipment.map((item) => (
            <EquipmentTableRow
              key={item.id}
              item={item}
              isSelected={selectedItem === item.id}
              onSelect={() => onItemSelect(item.id)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}