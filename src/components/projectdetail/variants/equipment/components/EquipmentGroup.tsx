import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ProjectEquipment } from "@/types/equipment";
import { ProjectEquipmentItem } from "./EquipmentItem";
import { formatPrice } from "@/utils/priceFormatters";
import { 
  COMPONENT_CLASSES, 
  FORM_PATTERNS,
  cn 
} from "@/design-system";

interface EquipmentGroupProps {
  id: string;
  name: string;
  equipment: ProjectEquipment[];
  isSelected: boolean;
  totalPrice: number;
  onSelect: () => void;
  onDelete: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onRemoveEquipment: (id: string) => void;
  compact?: boolean; // NEW: Support for compact layout
}

export function EquipmentGroup({
  id,
  name,
  equipment,
  isSelected,
  totalPrice,
  onSelect,
  onDelete,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemoveEquipment,
  compact = false
}: EquipmentGroupProps) {
  return (
    <Card 
      className={cn(
        COMPONENT_CLASSES.card.default,
        "transition-all duration-200 overflow-hidden",
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      role="group"
      aria-label={`Equipment group: ${name}`}
    >
      {/* Group Header */}
      <div className={cn(
        "border-b border-border",
        compact ? "p-2" : "p-4",
        isSelected ? "bg-primary/5" : "bg-muted/30"
      )}>
        <div className="flex items-center justify-between">
          {/* Group Name - Clickable */}
          <button
            onClick={onSelect}
            className={cn(
              "flex-1 text-left transition-colors",
              "hover:text-primary focus:text-primary focus:outline-none",
              isSelected ? "text-primary font-medium" : "text-foreground"
            )}
            aria-label={`Select ${name} group`}
          >
            <h3 className={cn("font-medium", compact ? "text-xs" : "text-sm")}>{name}</h3>
          </button>
          
          {/* Group Actions */}
          <div className="flex items-center gap-3">
            <span className={cn("text-muted-foreground font-medium", compact ? "text-xs" : "text-sm")}>
              {formatPrice(totalPrice)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
              aria-label={`Delete ${name} group`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Equipment List */}
      <div className={cn(compact ? "p-2" : "p-4")}>
        {equipment.length > 0 ? (
          <div className="space-y-2">
            {equipment.map((item) => (
              <div key={item.id} id={`equipment-${item.id}`}>
                <ProjectEquipmentItem
                  item={item}
                  onRemove={() => onRemoveEquipment(item.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No equipment in this group</p>
            <p className="text-xs mt-1">Drag equipment items here to add them</p>
          </div>
        )}
      </div>
    </Card>
  );
}