import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectEquipmentItem } from "./ProjectEquipmentItem";
import { useProjectEquipment } from "@/hooks/useProjectEquipment";
import { EquipmentSelector } from "./EquipmentSelector";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface ProjectBaseEquipmentListProps {
  projectId: string;
}

export function ProjectBaseEquipmentList({ projectId }: ProjectBaseEquipmentListProps) {
  const { equipment, loading, addEquipment, removeEquipment } = useProjectEquipment(projectId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Base Equipment List</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Equipment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Equipment to Project</DialogTitle>
            </DialogHeader>
            <EquipmentSelector onSelect={addEquipment} />
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
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
    </div>
  );
}