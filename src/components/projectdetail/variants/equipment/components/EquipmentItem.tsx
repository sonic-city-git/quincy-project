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
        "relative p-3 group",
        isRemoving && "opacity-50 pointer-events-none"
      )}
      draggable
      onDragStart={handleDragStart}
      role="listitem"
      aria-label={`${item.name} - Quantity: ${item.quantity}`}
    >
      <div className="flex items-center justify-between h-full">
        {/* Equipment Info Section */}
        <div className="flex items-center gap-3">
          {/* Quantity Input */}
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className={cn(
              FORM_PATTERNS.input.default,
              "w-12 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            )}
            min={1}
            disabled={isUpdating}
            aria-label={`Quantity for ${item.name}`}
          />
          
          {/* Equipment Name */}
          <h3 className="text-sm font-medium leading-none text-foreground">
            {item.name}
          </h3>
        </div>

        {/* Price and Actions Section */}
        <div className="flex items-center gap-3">
          {/* Total Price */}
          <div className="min-w-[100px] text-right text-sm text-muted-foreground font-medium">
            {formattedPrice}
          </div>
          
          {/* Remove Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
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