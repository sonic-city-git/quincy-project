import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Minus, Plus, X } from "lucide-react";
import { ProjectEquipment } from "@/types/equipment";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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

  const handleQuantityChange = async (delta: number) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity < 1) return;
    
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
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 bg-zinc-900/50 rounded-md p-0.5">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 hover:bg-zinc-700/50" 
              onClick={() => handleQuantityChange(-1)}
              disabled={isUpdating || item.quantity <= 1}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="w-6 text-center text-sm font-medium text-primary">{item.quantity}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 hover:bg-zinc-700/50"
              onClick={() => handleQuantityChange(1)}
              disabled={isUpdating}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-900/20" 
            onClick={onRemove}
            disabled={isUpdating}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}