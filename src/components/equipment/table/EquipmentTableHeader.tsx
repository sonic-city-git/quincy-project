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
        <TableHead className="w-12">
          <Checkbox 
            checked={selectedItems.length === equipment.length && equipment.length > 0}
            onCheckedChange={onSelectAll}
          />
        </TableHead>
        <TableHead>Code</TableHead>
        <TableHead>Name</TableHead>
        <TableHead>Stock</TableHead>
        <TableHead>Price</TableHead>
        <TableHead>Weight (kg)</TableHead>
        <TableHead>Book value</TableHead>
      </TableRow>
    </TableHeader>
  );
}