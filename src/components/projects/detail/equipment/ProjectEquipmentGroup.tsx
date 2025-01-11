import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { ProjectEquipmentItem } from "./ProjectEquipmentItem";
import { ProjectEquipment } from "@/types/equipment";

interface ProjectEquipmentGroupProps {
  name: string;
  equipment: ProjectEquipment[];
  onRemove: (id: string) => void;
}

export function ProjectEquipmentGroup({ name, equipment, onRemove }: ProjectEquipmentGroupProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        className="w-full flex items-center justify-between p-2 h-7 hover:bg-zinc-800/50"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span className="text-sm font-medium">{name}</span>
        {isCollapsed ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronUp className="h-4 w-4" />
        )}
      </Button>
      
      {!isCollapsed && (
        <div className="space-y-2 pl-2">
          {equipment.map((item) => (
            <ProjectEquipmentItem
              key={item.id}
              item={item}
              onRemove={() => onRemove(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}