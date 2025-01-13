import { TableCell, TableRow } from "@/components/ui/table";
import { Equipment } from "@/integrations/supabase/types/equipment";
import { formatPrice } from "@/utils/priceFormatters";

interface EquipmentTableRowProps {
  item: Equipment;
  isSelected: boolean;
  onSelect: () => void;
}

export function EquipmentTableRow({ item, isSelected, onSelect }: EquipmentTableRowProps) {
  return (
    <TableRow 
      className={`group hover:bg-zinc-800/50 cursor-pointer select-none flex flex-col md:table-row ${
        isSelected ? 'bg-zinc-800/75' : ''
      }`}
      onDoubleClick={onSelect}
    >
      <TableCell className="w-full md:w-[300px]">
        <div className="text-sm font-medium truncate">
          {item.name}
        </div>
      </TableCell>
      <TableCell className="w-full md:w-[200px]">
        <span className="text-sm text-muted-foreground truncate block">
          {item.code || '-'}
        </span>
      </TableCell>
      <TableCell className="w-[100px] text-right hidden md:table-cell">
        <span className="text-sm text-muted-foreground">
          {item.stock || 0}
        </span>
      </TableCell>
      <TableCell className="w-[150px] text-right hidden md:table-cell">
        <span className="text-sm text-muted-foreground">
          {item.rental_price ? formatPrice(item.rental_price) : '-'}
        </span>
      </TableCell>
    </TableRow>
  );
}