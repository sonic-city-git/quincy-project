import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectEquipmentItem } from "./ProjectEquipmentItem";
import { useProjectEquipment } from "@/hooks/useProjectEquipment";

interface ProjectBaseEquipmentListProps {
  projectId: string;
  selectedGroupId: string | null;
}

export function ProjectBaseEquipmentList({ projectId, selectedGroupId }: ProjectBaseEquipmentListProps) {
  const { equipment, loading, removeEquipment } = useProjectEquipment(projectId);

  const filteredEquipment = selectedGroupId
    ? equipment?.filter(item => item.group_id === selectedGroupId)
    : equipment;

  return (
    <ScrollArea className="h-[700px]">
      <div className="space-y-2 pr-4">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading equipment...</div>
        ) : filteredEquipment?.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {selectedGroupId ? "No equipment in this group" : "No equipment added yet"}
          </div>
        ) : (
          filteredEquipment?.map((item) => (
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