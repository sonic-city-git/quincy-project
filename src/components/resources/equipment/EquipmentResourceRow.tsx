import { TableRow, TableCell } from "@/components/ui/table";
import { ResourceEquipment } from "../types/resource";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/utils/priceFormatters";
import { Checkbox } from "@/components/ui/checkbox";

interface EquipmentResourceRowProps {
  resource: ResourceEquipment;
  isSelected: boolean;
  onSelect: () => void;
  showCheckbox?: boolean;
}

export function EquipmentResourceRow({
  resource,
  isSelected,
  onSelect,
  showCheckbox,
}: EquipmentResourceRowProps) {
  return (
    <TableRow
              className={`cursor-pointer ${isSelected ? "bg-primary/10" : ""}`}
      onClick={onSelect}
    >
      {showCheckbox && (
        <TableCell className="w-[30px]">
          <Checkbox checked={isSelected} />
        </TableCell>
      )}
      <TableCell className="py-2">
        <div className="flex items-center gap-3">
          <span>{resource.name}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="font-mono">
          {resource.stock} units
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex flex-col items-end text-sm">
          {resource.rate_daily && (
            <span>Daily: {formatPrice(resource.rate_daily)}</span>
          )}
          {resource.rate_hourly && (
            <span>Hourly: {formatPrice(resource.rate_hourly)}</span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}