import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Equipment } from "@/types/equipment";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  return (
    <ScrollArea className="h-[400px] w-full">
      <Table>
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
        <TableBody>
          {equipment.map((item) => (
            <TableRow key={item.id} className="hover:bg-zinc-800/50 border-b border-zinc-800/50">
              <TableCell className="w-12">
                <Checkbox 
                  checked={selectedItems.includes(item.id)}
                  onCheckedChange={() => onItemSelect(item.id)}
                />
              </TableCell>
              <TableCell className="font-mono font-inter whitespace-nowrap overflow-hidden text-ellipsis">{item.code}</TableCell>
              <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</TableCell>
              <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">{item.stock}</TableCell>
              <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">{item.price}</TableCell>
              <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">{item.weight} kg</TableCell>
              <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">
                {(parseFloat(item.value.replace(',', '')) * item.stock).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}