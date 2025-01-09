import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Equipment } from "@/types/equipment";

interface EquipmentTableHeaderProps {
  equipment: Equipment[];
  selectedItems: string[];
  onSelectAll: () => void;
}

export function EquipmentTableHeader({ 
  equipment, 
  selectedItems, 
  onSelectAll 
}: EquipmentTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow className="hover:bg-transparent border-b border-zinc-800/50">
        <TableHead className="w-12 py-3">
          <Checkbox 
            checked={selectedItems.length === equipment.length && equipment.length > 0}
            onCheckedChange={onSelectAll}
          />
        </TableHead>
        <TableHead className="py-3 font-medium">Code</TableHead>
        <TableHead className="py-3 font-medium">Name</TableHead>
        <TableHead className="py-3 font-medium">Stock</TableHead>
        <TableHead className="py-3 font-medium">Price</TableHead>
        <TableHead className="py-3 font-medium">Weight (kg)</TableHead>
      </TableRow>
    </TableHeader>
  );
}