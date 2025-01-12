import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Equipment } from "@/integrations/supabase/types/equipment";

interface EquipmentTableRowProps {
  item: Equipment;
  isSelected: boolean;
  onSelect: () => void;
}

export function EquipmentTableRow({ item, isSelected, onSelect }: EquipmentTableRowProps) {
  return (
    <TableRow 
      className={`group hover:bg-zinc-800/50 ${
        isSelected ? 'bg-zinc-800/75' : ''
      }`}
    >
      <TableCell className="w-12">
        <Checkbox 
          checked={isSelected}
          onCheckedChange={onSelect}
        />
      </TableCell>
      <TableCell className="w-[200px]">
        <div className="text-sm font-medium truncate max-w-[200px]">
          {item.name}
        </div>
      </TableCell>
      <TableCell className="w-[150px] text-sm text-muted-foreground">
        <span className="truncate block max-w-[150px]">
          {item.code || '-'}
        </span>
      </TableCell>
      <TableCell className="w-[100px] text-sm text-muted-foreground">
        {item.stock || 0}
      </TableCell>
      <TableCell className="w-[150px] text-sm text-muted-foreground">
        {item.rental_price ? `${item.rental_price} kr` : '-'}
      </TableCell>
    </TableRow>
  );
}