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
        <TableHead className="w-12 py-2">
          <Checkbox 
            checked={selectedItems.length === equipment.length && equipment.length > 0}
            onCheckedChange={onSelectAll}
          />
        </TableHead>
        <TableHead className="py-2">Code</TableHead>
        <TableHead className="py-2">Name</TableHead>
        <TableHead className="py-2">Stock</TableHead>
        <TableHead className="py-2">Price</TableHead>
        <TableHead className="py-2">Weight (kg)</TableHead>
        <TableHead className="py-2">Book value</TableHead>
      </TableRow>
    </TableHeader>
  );
}