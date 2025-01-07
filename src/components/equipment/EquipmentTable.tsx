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
            <TableHead className="font-medium text-zinc-400">Code</TableHead>
            <TableHead className="font-medium text-zinc-400">Name</TableHead>
            <TableHead className="font-medium text-zinc-400">Stock</TableHead>
            <TableHead className="font-medium text-zinc-400">Price</TableHead>
            <TableHead className="font-medium text-zinc-400">Weight (kg)</TableHead>
            <TableHead className="font-medium text-zinc-400">Book value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {equipment.map((item) => (
            <TableRow key={item.id} className="hover:bg-zinc-800/30 border-b border-zinc-800/30">
              <TableCell className="w-12">
                <Checkbox 
                  checked={selectedItems.includes(item.id)}
                  onCheckedChange={() => onItemSelect(item.id)}
                />
              </TableCell>
              <TableCell className="font-mono text-sm text-zinc-300">{item.code}</TableCell>
              <TableCell className="text-sm text-zinc-100">{item.name}</TableCell>
              <TableCell className="text-sm text-zinc-300">{item.stock}</TableCell>
              <TableCell className="text-sm text-zinc-300">{item.price}</TableCell>
              <TableCell className="text-sm text-zinc-300">{item.weight} kg</TableCell>
              <TableCell className="text-sm text-zinc-300">
                {(parseFloat(item.value.replace(',', '')) * item.stock).toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}