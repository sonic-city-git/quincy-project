import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Minus, Plus, X } from "lucide-react";
import { ProjectEquipment } from "@/types/equipment";

interface ProjectEquipmentItemProps {
  item: ProjectEquipment;
  onRemove: () => void;
}

export function ProjectEquipmentItem({ item, onRemove }: ProjectEquipmentItemProps) {
  return (
    <Card className="p-1 h-[56px]">
      <div className="flex items-center justify-between h-full">
        <div>
          <h3 className="text-sm font-medium leading-tight">{item.name}</h3>
        </div>
        <div className="flex items-center gap-0.5">
          <div className="flex items-center gap-0.5">
            <Button variant="outline" size="icon" className="h-6 w-6">
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-6 text-center text-sm">{item.quantity}</span>
            <Button variant="outline" size="icon" className="h-6 w-6">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}