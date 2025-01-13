import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectEquipment } from "@/types/equipment";
import { ProjectEquipmentItem } from "../ProjectEquipmentItem";
import { formatPrice } from "@/utils/priceFormatters";

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
  onRemoveEquipment
}: EquipmentGroupProps) {
  return (
    <div 
      className={cn(
        "rounded-lg border-2 transition-all duration-200 relative overflow-hidden",
        isSelected 
          ? "border-primary bg-primary/5" 
          : "border-zinc-800/50 hover:border-primary/20 hover:bg-primary/5"
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className={cn(
        "absolute inset-0 transition-all duration-200",
        isSelected 
          ? "bg-primary/5" 
          : "bg-zinc-900/50 group-hover:bg-primary/5"
      )} />
      <div className="relative z-20">
        <div className={cn(
          "transition-colors",
          isSelected ? "bg-primary/10" : "bg-zinc-900/90"
        )}>
          <div className="flex items-center justify-between px-4 py-2">
            <div 
              className={cn(
                "flex-1 cursor-pointer transition-colors",
                isSelected 
                  ? "text-primary font-medium" 
                  : "text-white hover:text-primary/90"
              )}
              onClick={onSelect}
            >
              <h3 className="text-sm font-medium">{name}</h3>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {formatPrice(totalPrice)}
              </span>
              <button
                onClick={onDelete}
                className="text-red-500 hover:text-red-400 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="p-3 space-y-2 relative z-30 bg-background/95">
          {equipment.map((item) => (
            <div key={item.id} id={`equipment-${item.id}`}>
              <ProjectEquipmentItem
                item={item}
                onRemove={() => onRemoveEquipment(item.id)}
              />
            </div>
          ))}
          {equipment.length === 0 && (
            <div className="text-sm text-muted-foreground px-1">
              No equipment in this group
            </div>
          )}
        </div>
      </div>
    </div>
  );
}