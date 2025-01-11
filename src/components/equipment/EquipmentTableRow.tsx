import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Equipment } from "@/integrations/supabase/types/equipment";

interface EquipmentTableRowProps {
  item: Equipment;
  isSelected: boolean;
  onSelect: () => void;
}

export function EquipmentTableRow({ item, isSelected, onSelect }: EquipmentTableRowProps) {
  const availableSerialNumbers = item.equipment_serial_numbers?.filter(
    (sn) => sn.status === 'Available'
  ) || [];

  const serialNumbers = item.equipment_serial_numbers?.map(sn => sn.serial_number).join(', ') || '-';

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
      <TableCell>
        <div className="text-sm font-medium truncate max-w-[200px]">
          {item.name}
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        <span className="truncate block max-w-[150px]">
          {item.code || '-'}
        </span>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        <div className="flex flex-col gap-1">
          <span className="truncate block max-w-[250px]" title={serialNumbers}>
            {serialNumbers}
          </span>
          <span className="text-xs text-muted-foreground">
            {item.equipment_serial_numbers?.length || 0} total
            ({availableSerialNumbers.length} available)
          </span>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {item.stock || 0}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {item.rental_price ? `${item.rental_price} kr` : '-'}
      </TableCell>
    </TableRow>
  );
}