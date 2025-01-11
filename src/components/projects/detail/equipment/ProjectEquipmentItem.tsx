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
    <Card className="p-2 h-[64px]">
      <div className="flex items-center justify-between h-full">
        <div>
          <h3 className="text-sm font-medium leading-tight">{item.name}</h3>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7">
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <Button variant="outline" size="icon" className="h-7 w-7">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}