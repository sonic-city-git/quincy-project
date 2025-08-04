import { TableCell, TableRow } from "@/components/ui/table";
import { Equipment } from "@/integrations/supabase/types/equipment";
import { formatPrice } from "@/utils/priceFormatters";
import { COMPONENT_CLASSES, cn } from "@/design-system";

interface EquipmentTableRowProps {
  item: Equipment;
  isSelected: boolean;
  isHighlighted?: boolean;
  onSelect: () => void;
}

export function EquipmentTableRow({ item, isSelected, isHighlighted, onSelect }: EquipmentTableRowProps) {
  return (
    <div 
      data-equipment-id={item.id}
      className={cn(
        "grid grid-cols-[2fr_120px_100px] sm:grid-cols-[2fr_120px_80px_100px] gap-3 sm:gap-4 p-3 sm:p-4 cursor-pointer select-none transition-colors duration-300 group",
        COMPONENT_CLASSES.table.row,
        isSelected && "bg-muted/75",
        isHighlighted && "bg-primary/20 border border-primary/50"
      )}
      onDoubleClick={onSelect}
    >
      {/* Name */}
      <div className="flex flex-col space-y-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {item.name}
        </div>
      </div>

      {/* Code */}
      <div className="flex items-center">
        <span className="text-sm text-muted-foreground truncate">
          {item.code || '-'}
        </span>
      </div>

      {/* Stock - Hidden on mobile */}
      <div className="hidden sm:flex items-center justify-end">
        <span className="text-sm text-muted-foreground">
          {item.stock || 0}
        </span>
      </div>

      {/* Price - Always visible, right aligned */}
      <div className="flex items-center justify-end">
        <span className="text-sm text-muted-foreground">
          {item.rental_price ? formatPrice(item.rental_price) : '-'}
        </span>
      </div>
    </div>
  );
}