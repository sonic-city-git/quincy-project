import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { ProjectEquipment } from "@/types/equipment";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatPrice } from "@/utils/priceFormatters";

interface ProjectEquipmentItemProps {
  item: ProjectEquipment;
  onRemove: () => void;
}

export function ProjectEquipmentItem({ item, onRemove }: ProjectEquipmentItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const queryClient = useQueryClient();

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

      if (error) throw error;
      
      await queryClient.invalidateQueries({ 
        queryKey: ['project-equipment'] 
      });
      
      toast.success('Quantity updated');
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    await onRemove();
    setIsRemoving(false);
  };

  return (
    <Card 
      className={`relative p-1.5 transition-colors border-zinc-800/50 hover:bg-zinc-800/50 bg-zinc-800/50 group ${
        isRemoving ? 'opacity-50' : ''
      }`}
      draggable
      onDragStart={handleDragStart}
    >
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className="w-10 h-7 bg-zinc-900/50 border-zinc-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center"
            min={1}
            disabled={isUpdating}
          />
          <h3 className="text-sm font-medium leading-none text-zinc-200">
            {item.name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="min-w-[100px] text-right text-sm text-muted-foreground">
            {item.rental_price ? formatPrice(item.rental_price * item.quantity) : '-'}
          </div>
          <button 
            className="h-6 w-6 inline-flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md disabled:opacity-50"
            onClick={handleRemove}
            disabled={isRemoving || isUpdating}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}