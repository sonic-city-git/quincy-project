import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectEquipmentItem } from "./ProjectEquipmentItem";
import { ProjectEquipment } from "@/types/equipment";
import { SPACING, cn } from "@/design-system";

interface ProjectEquipmentListProps {
  equipment: ProjectEquipment[];
  loading: boolean;
  onRemove: (id: string) => void;
  className?: string;
}

export function ProjectEquipmentList({ 
  equipment, 
  loading, 
  onRemove, 
  className 
}: ProjectEquipmentListProps) {
  if (loading) {
    return (
      <div 
        className="flex items-center justify-center py-12" 
        role="status" 
        aria-label="Loading equipment"
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (equipment.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p>No equipment added to this project</p>
        <p className="text-xs mt-2">Drag equipment items here or use the equipment selector</p>
      </div>
    );
  }

  return (
    <ScrollArea className={cn("flex-1 pr-4", className)}>
      <div 
        className="space-y-2" 
        role="list" 
        aria-label={`Project equipment (${equipment.length} items)`}
      >
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