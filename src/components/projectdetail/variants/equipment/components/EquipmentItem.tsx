import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ProjectEquipment } from "@/types/equipment";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatPrice } from "@/utils/priceFormatters";
import { 
  COMPONENT_CLASSES, 
  FORM_PATTERNS, 
  cn 
} from "@/design-system";

interface ProjectEquipmentItemProps {
  item: ProjectEquipment;
  onRemove: () => void;
}

export function ProjectEquipmentItem({ item, onRemove }: ProjectEquipmentItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const queryClient = useQueryClient();

  // Memoize formatted price for performance
  const formattedPrice = useMemo(() => {
    return item.rental_price ? formatPrice(item.rental_price * item.quantity) : '-';
  }, [item.rental_price, item.quantity]);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      ...item,
      type: 'project-equipment'
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleQuantityChange = async (value: string) => {
    const newQuantity = parseInt(value, 10);
    if (isNaN(newQuantity) || newQuantity < 1) return;
    
    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from('project_equipment')
        .update({ quantity: newQuantity })
        .eq('id', item.id);

      if (error) {
        throw new Error(`Failed to update quantity: ${error.message}`);
      }
      
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['project-equipment'] }),
        queryClient.invalidateQueries({ queryKey: ['sync-status'] })
      ]);
      
      toast.success('Quantity updated');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update quantity';
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove();
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Card 
      className={cn(
        COMPONENT_CLASSES.card.hover,
        "relative group transition-all duration-200",
        "border-l-4 border-l-accent hover:border-l-primary",
        "py-1 px-3",
        isRemoving && "opacity-50 pointer-events-none animate-pulse",
        isUpdating && "ring-2 ring-primary/20"
      )}
      draggable
      onDragStart={handleDragStart}
      role="listitem"
      aria-label={`${item.name} - Quantity: ${item.quantity}, Total: ${formattedPrice}`}
    >
      <div className="flex items-center justify-between h-full">
        {/* Equipment Info Section */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Compact Quantity Input */}
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className={cn(
              FORM_PATTERNS.input.default,
              "w-9 h-4 text-center text-xs font-bold",
              "border focus:border-primary transition-colors",
              "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
              isUpdating && "border-primary bg-primary/5"
            )}
            min={1}
            disabled={isUpdating}
            aria-label={`Quantity for ${item.name}`}
          />
          
          {/* Equipment Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold leading-tight text-foreground truncate group-hover:text-primary transition-colors tracking-tight">
                {item.name}
              </h3>
              {item.code && (
                <span className="text-xs text-muted-foreground/70 font-mono flex-shrink-0 bg-muted/40 px-1 py-0.5 rounded leading-none">
                  {item.code}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Price and Actions Section */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Compact Price Display */}
          <div className="text-right min-w-[55px]">
            <div className="text-xs font-bold text-muted-foreground/80 leading-none tracking-tight">
              {formattedPrice}
            </div>
          </div>
          
          {/* Enhanced Remove Button */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 transition-all duration-200 rounded-md",
              "text-muted-foreground/60 hover:text-white",
              "hover:bg-destructive hover:shadow-sm focus:bg-destructive focus:text-white",
              "opacity-0 group-hover:opacity-100 focus:opacity-100",
              "scale-90 hover:scale-100 focus:scale-100",
              "border border-transparent hover:border-destructive/20"
            )}
            onClick={handleRemove}
            disabled={isRemoving || isUpdating}
            aria-label={`Remove ${item.name} from project`}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}