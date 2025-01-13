import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { ProjectEquipment } from "@/types/equipment";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { formatPrice } from "@/utils/priceFormatters";

interface ProjectEquipmentItemProps {
  item: ProjectEquipment;
  onRemove: () => void;
  onGroupChange?: (itemId: string, newGroupId: string | null) => void;
}

export function ProjectEquipmentItem({ item, onRemove, onGroupChange }: ProjectEquipmentItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const queryClient = useQueryClient();

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: item.id,
      currentGroupId: item.group_id
    }));
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleQuantityChange = async (value: string) => {
    const newQuantity = parseInt(value, 10);
    if (isNaN(newQuantity) || newQuantity < 1) return;
    
    setIsUpdating(true);

    queryClient.setQueryData(['project-equipment', item.id], (oldData: ProjectEquipment[] | undefined) => {
      if (!oldData) return [{ ...item, quantity: newQuantity }];
      return oldData.map(equipment => 
        equipment.id === item.id ? { ...equipment, quantity: newQuantity } : equipment
      );
    });
    
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
      
      queryClient.setQueryData(['project-equipment', item.id], (oldData: ProjectEquipment[] | undefined) => {
        if (!oldData) return [item];
        return oldData.map(equipment => 
          equipment.id === item.id ? item : equipment
        );
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const totalPrice = (item.rental_price || 0) * item.quantity;

  return (
    <Card className={cn(
      "relative p-1.5 transition-colors border-zinc-800/50 hover:bg-zinc-800/50 bg-zinc-800/50 group",
      isDragging && "opacity-50"
    )}>
      <div className="flex items-center justify-between h-full">
        <h3 
          className="text-sm font-medium leading-none text-zinc-200 cursor-grab active:cursor-grabbing px-1"
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {item.name}
        </h3>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className="w-10 h-7 bg-zinc-900/50 border-zinc-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center"
            min={1}
            disabled={isUpdating}
          />
          <div className="min-w-[100px] text-right text-sm text-muted-foreground">
            {formatPrice(totalPrice)}
          </div>
          <button 
            className="h-6 w-6 inline-flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md"
            onClick={onRemove}
            disabled={isUpdating}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}