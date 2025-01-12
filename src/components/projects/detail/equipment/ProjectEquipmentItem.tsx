import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GripVertical, Minus, Plus, X } from "lucide-react";
import { ProjectEquipment } from "@/types/equipment";
import { cn } from "@/lib/utils";

interface ProjectEquipmentItemProps {
  item: ProjectEquipment;
  onRemove: () => void;
  onGroupChange?: (itemId: string, newGroupId: string | null) => void;
}

export function ProjectEquipmentItem({ item, onRemove, onGroupChange }: ProjectEquipmentItemProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: item.id,
      currentGroupId: item.group_id
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Card className="p-1 h-[28px]">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5 cursor-grab active:cursor-grabbing" 
            draggable
            onDragStart={handleDragStart}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </Button>
          <h3 className="text-sm font-medium leading-none">{item.name}</h3>
        </div>
        <div className="flex items-center gap-0.5">
          <div className="flex items-center gap-0.5">
            <Button variant="outline" size="icon" className="h-5 w-5">
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-6 text-center text-sm">{item.quantity}</span>
            <Button variant="outline" size="icon" className="h-5 w-5">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onRemove}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}