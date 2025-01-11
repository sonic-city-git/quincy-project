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
    <Card className="p-4 h-[72px]">
      <div className="flex items-center justify-between h-full">
        <div>
          <h3 className="font-medium">{item.name}</h3>
          {item.code && (
            <div className="text-sm text-muted-foreground">{item.code}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8">
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center">{item.quantity}</span>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRemove}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}