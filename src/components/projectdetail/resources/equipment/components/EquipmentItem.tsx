import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ProjectEquipment } from "@/types/equipment";
import { useState, useMemo, useEffect } from "react";
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
  onUpdateQuantity?: (itemId: string, quantity: number) => Promise<void>;
  onSelect?: () => void;
}

export function ProjectEquipmentItem({ item, onRemove, onUpdateQuantity, onSelect }: ProjectEquipmentItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [inputValue, setInputValue] = useState(item.quantity.toString());
  const queryClient = useQueryClient();

  // Sync input value when external quantity changes
  useEffect(() => {
    setInputValue(item.quantity.toString());
  }, [item.quantity]);

  // Memoize formatted price for performance
  const formattedPrice = useMemo(() => {
    return item.rental_price ? formatPrice(item.rental_price * item.quantity) : '-';
  }, [item.rental_price, item.quantity]);



  const applyQuantityChange = async () => {
    const newQuantity = parseInt(inputValue, 10);
    if (isNaN(newQuantity) || newQuantity < 1) {
      // Reset to original value if invalid
      setInputValue(item.quantity.toString());
      return;
    }
    
    // Don't update if value hasn't changed
    if (newQuantity === item.quantity) return;
    
    setIsUpdating(true);

    try {
      if (onUpdateQuantity) {
        // Use variant-specific update function with optimistic updates
        await onUpdateQuantity(item.id, newQuantity);
      } else {
        // Fallback to direct Supabase call for non-variant contexts
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
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update quantity';
      toast.error(errorMessage);
      // Reset to original value on error
      setInputValue(item.quantity.toString());
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Prevent event bubbling to parent group
    
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur(); // Remove focus after applying
      applyQuantityChange();
    } else if (e.key === 'Escape') {
      // Reset to original value and blur
      setInputValue(item.quantity.toString());
      e.currentTarget.blur();
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select all text when clicking/focusing
    e.target.select();
  };

  const handleBlur = () => {
    // Reset to original value if user clicks away without pressing Enter
    setInputValue(item.quantity.toString());
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling to parent group
    
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
        "relative group transition-all duration-200 cursor-pointer",
        "border-l-4 border-l-accent hover:border-l-primary",
        "py-1 px-3",
        isRemoving && "opacity-50 pointer-events-none animate-pulse",
        isUpdating && "ring-2 ring-primary/20"
      )}
      onClick={() => onSelect?.()}
      role="listitem"
      aria-label={`${item.name} - Quantity: ${item.quantity}, Total: ${formattedPrice}`}
    >
      <div className="flex items-center justify-between h-full">
        {/* Equipment Info Section */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Compact Quantity Input */}
          <Input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              FORM_PATTERNS.input.default,
              "w-12 h-4 text-center text-xs font-bold",
              "border focus:border-primary transition-colors",
              "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
              isUpdating && "border-primary bg-primary/5"
            )}
            min={1}
            disabled={isUpdating}
            aria-label={`Quantity for ${item.name} - Press Enter to save, Escape or click away to cancel`}
            title="Click to select all, type new quantity, press Enter to save"
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