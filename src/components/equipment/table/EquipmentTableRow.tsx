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
  const formatValue = (value: string | undefined) => {
    if (!value) return "0.00";
    const num = parseFloat(value.replace(',', ''));
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  return (
    <TableRow className="hover:bg-zinc-800/50 border-b border-zinc-800/50">
      <TableCell className="w-12 py-2">
        <Checkbox 
          checked={isSelected}
          onCheckedChange={() => onItemSelect(item.id)}
        />
      </TableCell>
      <TableCell className="font-mono font-inter whitespace-nowrap overflow-hidden text-ellipsis py-2">
        {item.code}
      </TableCell>
      <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis py-2">
        {item.name}
      </TableCell>
      <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis py-2">
        {item.stock}
      </TableCell>
      <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis py-2">
        {formatValue(item.price)}
      </TableCell>
      <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis py-2">
        {item.weight} kg
      </TableCell>
    </TableRow>
  );
}