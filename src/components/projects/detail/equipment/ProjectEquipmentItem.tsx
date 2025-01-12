import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GripVertical, Minus, Plus, X } from "lucide-react";
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
  const queryClient = useQueryClient();

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: item.id,
      currentGroupId: item.group_id
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleQuantityChange = async (delta: number) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity < 1) return;
    
    setIsUpdating(true);

    // Optimistically update the UI
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
      
      // Invalidate and refetch to ensure consistency
      await queryClient.invalidateQueries({ 
        queryKey: ['project-equipment'] 
      });
      
      toast.success('Quantity updated');
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
      
      // Revert optimistic update on error
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
    <Card className="relative p-2 transition-colors border-zinc-800/50 hover:bg-zinc-800/50 group">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity" 
            draggable
            onDragStart={handleDragStart}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </Button>
          <h3 className="text-sm font-medium leading-none text-zinc-200">{item.name}</h3>
        </div>
        <div className="flex items-center gap-0.5">
          <div className="flex items-center gap-0.5">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5 hover:bg-zinc-700/50" 
              onClick={() => handleQuantityChange(-1)}
              disabled={isUpdating || item.quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-6 text-center text-sm text-zinc-300">{item.quantity}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5 hover:bg-zinc-700/50"
              onClick={() => handleQuantityChange(1)}
              disabled={isUpdating}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5 text-red-400 hover:text-red-300 hover:bg-red-900/20" 
            onClick={onRemove}
            disabled={isUpdating}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}