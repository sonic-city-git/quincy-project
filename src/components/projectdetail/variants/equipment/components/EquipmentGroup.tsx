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
        "transition-all duration-300 overflow-hidden relative",
        isSelected 
          ? "ring-2 ring-inset ring-primary shadow-lg shadow-primary/10 border-primary bg-primary/5" 
          : "border-border/60 hover:border-border shadow-sm hover:shadow-md"
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      role="group"
      aria-label={`Equipment group: ${name}`}
    >
      {/* Group Header */}
      <div className={cn(
        "border-b transition-all duration-300 relative select-none cursor-pointer", // Prevent text selection on header
        compact ? "p-1" : "p-1.5",
        isSelected 
          ? "bg-primary/10 border-primary/30" 
          : "bg-muted/30 hover:bg-primary/5 border-border/50 hover:border-primary/20"
      )}
      onClick={onSelect}>
        <div className="flex items-center justify-between" style={{ userSelect: 'none' }}>
          {/* Group Name - Display Only */}
          <div
            className={cn(
              "flex-1 text-left", 
              "select-none", // Remove all button styling
              isSelected ? "text-primary font-semibold" : "text-foreground font-medium"
            )}
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }} // Extra prevention
          >
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "w-2.5 h-2.5 rounded-full transition-all duration-200 border-2 flex-shrink-0",
                isSelected 
                  ? "bg-primary border-primary shadow-sm shadow-primary/25" 
                  : "bg-muted-foreground/30 border-muted-foreground/40 group-hover:border-primary/50"
              )} />
              <h3 className={cn(
                "leading-tight select-none font-semibold tracking-tight", 
                compact ? "text-sm" : "text-sm"
              )}>
                {name}
              </h3>
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-md transition-colors font-medium select-none flex-shrink-0 leading-none",
                compact ? "hidden" : "block",
                isSelected 
                  ? "text-primary/90 bg-primary/12 border border-primary/20" 
                  : "text-muted-foreground/80 bg-muted/50"
              )}>
                {equipment.length}
              </span>
            </div>
          </div>
          
          {/* Group Actions */}
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "text-right",
              compact ? "min-w-[55px]" : "min-w-[70px]"
            )}>
              <div className={cn(
                "font-bold text-foreground tracking-tight leading-none",
                compact ? "text-xs" : "text-sm"
              )}>
                {formatPrice(totalPrice)}
              </div>
              {!compact && equipment.length > 0 && (
                <div className="text-xs text-muted-foreground/70 leading-none mt-0.5 font-medium">
                  {equipment.length} items
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className={cn(
                "p-0 transition-all duration-200 rounded-md",
                "text-muted-foreground/50 hover:text-white",
                "hover:bg-destructive hover:shadow-sm focus:bg-destructive focus:text-white",
                "opacity-40 hover:opacity-100 focus:opacity-100",
                "scale-90 hover:scale-100 focus:scale-100",
                "border border-transparent hover:border-destructive/20",
                compact ? "h-6 w-6" : "h-7 w-7"
              )}
              aria-label={`Delete ${name} group`}
            >
              <X className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
            </Button>
          </div>
        </div>
      </div>

      {/* Equipment List */}
      <div className={cn(
        compact ? "p-1" : "p-1.5",
        "min-h-[30px] relative" // Ensure minimum height for drop zones
      )}>
        {equipment.length > 0 ? (
          <div className="space-y-0.5">
            {equipment.map((item) => (
              <div 
                key={item.id} 
                id={`equipment-${item.id}`}
                className="transition-all duration-200 hover:scale-[1.005]"
              >
                <ProjectEquipmentItem
                  item={item}
                  onRemove={() => onRemoveEquipment(item.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className={cn(
            "flex flex-col items-center justify-center text-muted-foreground transition-all duration-200",
            "border-2 border-dashed border-muted/40 rounded-lg",
            "hover:border-primary/40 hover:bg-primary/5",
            compact ? "py-3" : "py-6"
          )}>
            <div className={cn(
              "w-6 h-6 rounded-full bg-muted/40 flex items-center justify-center mb-1",
              compact && "w-5 h-5 mb-1"
            )}>
              <div className={cn(
                "w-1.5 h-1.5 bg-muted-foreground/60 rounded-full",
                compact && "w-1 h-1"
              )} />
            </div>
            <p className={cn("font-medium", compact ? "text-xs" : "text-sm")}>
              No equipment in this group
            </p>
            <p className={cn("mt-0.5 text-center max-w-xs text-xs", compact && "text-xs")}>
              Drag equipment items here to add them
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}