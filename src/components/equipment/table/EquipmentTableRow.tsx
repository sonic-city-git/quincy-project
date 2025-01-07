import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Equipment } from "@/types/equipment";

interface EquipmentTableRowProps {
  item: Equipment;
  isSelected: boolean;
  onItemSelect: (id: string) => void;
}

export function EquipmentTableRow({ 
  item, 
  isSelected, 
  onItemSelect 
}: EquipmentTableRowProps) {
  return (
    <TableRow className="hover:bg-zinc-800/50 border-b border-zinc-800/50">
      <TableCell className="w-12">
        <Checkbox 
          checked={isSelected}
          onCheckedChange={() => onItemSelect(item.id)}
        />
      </TableCell>
      <TableCell className="font-mono font-inter whitespace-nowrap overflow-hidden text-ellipsis">
        {item.code}
      </TableCell>
      <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">
        {item.name}
      </TableCell>
      <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">
        {item.stock}
      </TableCell>
      <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">
        {item.price}
      </TableCell>
      <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">
        {item.weight} kg
      </TableCell>
      <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">
        {(parseFloat(item.value.replace(',', '')) * item.stock).toLocaleString('en-US', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })}
      </TableCell>
    </TableRow>
  );
}