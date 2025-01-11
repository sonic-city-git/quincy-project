import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EquipmentTableRow } from "./EquipmentTableRow";
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
        <TableHeader className="sticky top-0 bg-zinc-900/95 border-b border-zinc-800 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/75 z-10">
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead className="min-w-[200px]">Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Serial Numbers</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Price</TableHead>
          </TableRow>
        </TableHeader>
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