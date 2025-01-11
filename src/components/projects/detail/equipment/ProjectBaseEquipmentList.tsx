import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectEquipmentItem } from "./ProjectEquipmentItem";
import { useProjectEquipment } from "@/hooks/useProjectEquipment";

interface ProjectBaseEquipmentListProps {
  projectId: string;
}

export function ProjectBaseEquipmentList({ projectId }: ProjectBaseEquipmentListProps) {
  const { equipment, loading, removeEquipment } = useProjectEquipment(projectId);

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-2 pr-4">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading equipment...</div>
        ) : equipment?.length === 0 ? (
          <div className="text-sm text-muted-foreground">No equipment added yet</div>
        ) : (
          equipment?.map((item) => (
            <ProjectEquipmentItem
              key={item.id}
              item={item}
              onRemove={() => removeEquipment(item.id)}
            />
          ))
        )}
      </div>
    </ScrollArea>
  );
}