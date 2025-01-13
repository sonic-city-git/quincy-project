import { TableCell, TableRow } from "@/components/ui/table";
import { Equipment } from "@/integrations/supabase/types/equipment";
import { EquipmentActions } from "./EquipmentActions";

interface EquipmentTableRowProps {
  item: Equipment;
  isSelected: boolean;
  onSelect: () => void;
}

export function EquipmentTableRow({ item, isSelected, onSelect }: EquipmentTableRowProps) {
  return (
    <TableRow 
      className={`group hover:bg-zinc-800/50 cursor-pointer ${isSelected ? 'bg-zinc-800/50' : ''}`}
      onClick={onSelect}
    >
      <TableCell className="w-[100px] text-sm text-muted-foreground">
        {item.code || '-'}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-between">
          <span className="text-[15px]">{item.name}</span>
          {isSelected && (
            <EquipmentActions 
              selectedItems={[item.id]} 
            />
          )}
        </div>
      </TableCell>
      <TableCell className="text-right text-sm text-muted-foreground">
        {item.rental_price ? `${item.rental_price.toFixed(2)} kr` : '-'}
      </TableCell>
      <TableCell className="text-right text-sm text-muted-foreground">
        {item.stock || '-'}
      </TableCell>
    </TableRow>
  );
}