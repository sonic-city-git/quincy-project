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
      className={`group hover:bg-zinc-800/50 cursor-pointer select-none ${
        isSelected ? 'bg-zinc-800/75' : ''
      }`}
      onDoubleClick={onSelect}
    >
      <TableCell className="w-[200px] min-w-[200px] lg:w-[300px]">
        <div className="text-sm font-medium truncate">
          {item.name}
        </div>
      </TableCell>
      <TableCell className="w-[150px] min-w-[150px] lg:w-[200px]">
        <span className="text-sm text-muted-foreground truncate block">
          {item.code || '-'}
        </span>
      </TableCell>
      <TableCell className="w-[80px] min-w-[80px] lg:w-[100px] text-right">
        <span className="text-sm text-muted-foreground">
          {item.stock || 0}
        </span>
      </TableCell>
      <TableCell className="w-[120px] min-w-[120px] lg:w-[150px] text-right">
        <span className="text-sm text-muted-foreground">
          {item.rental_price ? formatPrice(item.rental_price) : '-'}
        </span>
      </TableCell>
    </TableRow>
  );
}