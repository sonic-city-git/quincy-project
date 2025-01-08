import { Table } from "@/components/ui/table";
import { Equipment } from "@/types/equipment";
import { EquipmentTableHeader } from "./table/EquipmentTableHeader";
import { EquipmentTableContent } from "./table/EquipmentTableContent";

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
    <div className="rounded-md border">
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