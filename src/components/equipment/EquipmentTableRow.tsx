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
      <TableCell className="w-[48px]">
        <Checkbox 
          checked={isSelected}
          onCheckedChange={onSelect}
          className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      </TableCell>
      <TableCell className="w-[300px]">
        <div className="text-sm font-medium truncate">
          {item.name}
        </div>
      </TableCell>
      <TableCell className="w-[200px]">
        <span className="text-sm text-muted-foreground truncate block">
          {item.code || '-'}
        </span>
      </TableCell>
      <TableCell className="w-[100px] text-right">
        <span className="text-sm text-muted-foreground">
          {item.stock || 0}
        </span>
      </TableCell>
      <TableCell className="w-[150px] text-right">
        <span className="text-sm text-muted-foreground">
          {item.rental_price ? `${item.rental_price} kr` : '-'}
        </span>
      </TableCell>
    </TableRow>
  );
}