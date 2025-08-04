import { Table, TableBody } from "@/components/ui/table";
import { EquipmentTableRow } from "./EquipmentTableRow";
import { Equipment } from "@/integrations/supabase/types/equipment";

interface EquipmentTableProps {
  equipment: Equipment[];
  selectedItem: string | null;
  onItemSelect: (id: string) => void;
  highlightedItem?: string | null;
}

export function EquipmentTable({ equipment, selectedItem, onItemSelect, highlightedItem }: EquipmentTableProps) {
  return (
    <div className="relative">
      <Table>
        <TableBody>
          {equipment.map((item) => (
            <EquipmentTableRow
              key={item.id}
              item={item}
              isSelected={selectedItem === item.id}
              isHighlighted={highlightedItem === item.id}
              onSelect={() => onItemSelect(item.id)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}