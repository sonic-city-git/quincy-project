import { Table } from "@/components/ui/table";
import { Equipment } from "@/types/equipment";
import { EquipmentTableHeader } from "./EquipmentTableHeader";
import { EquipmentTableContent } from "./EquipmentTableContent";

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
  onItemSelect,
}: EquipmentTableProps) {
  return (
    <div className="rounded-md border border-zinc-800/50">
      <Table>
        <EquipmentTableHeader
          equipment={equipment}
          selectedItems={selectedItems}
          onSelectAll={onSelectAll}
        />
        <EquipmentTableContent
          equipment={equipment}
          selectedItems={selectedItems}
          onItemSelect={onItemSelect}
        />
      </Table>
    </div>
  );
}