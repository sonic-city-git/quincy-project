import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectEquipmentItem } from "./ProjectEquipmentItem";
import { ProjectEquipment } from "@/types/equipment";

interface ProjectEquipmentListProps {
  equipment: ProjectEquipment[];
  loading: boolean;
  onRemove: (id: string) => void;
}

export function ProjectEquipmentList({ equipment, loading, onRemove }: ProjectEquipmentListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (equipment.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        No equipment added to this project
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-2">
        {equipment.map((item) => (
          <ProjectEquipmentItem 
            key={item.id} 
            item={item}
            onRemove={() => onRemove(item.id)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}