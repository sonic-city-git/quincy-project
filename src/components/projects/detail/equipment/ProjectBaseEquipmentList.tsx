import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ProjectEquipmentItem } from "./ProjectEquipmentItem";
import { useProjectEquipment } from "@/hooks/useProjectEquipment";
import { ProjectEquipmentGroup } from "./ProjectEquipmentGroup";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface ProjectBaseEquipmentListProps {
  projectId: string;
}

export function ProjectBaseEquipmentList({ projectId }: ProjectBaseEquipmentListProps) {
  const { equipment, loading, removeEquipment } = useProjectEquipment(projectId);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      // TODO: Add group creation logic
      setNewGroupName("");
      setIsAddingGroup(false);
    }
  };

  const groupedEquipment = equipment?.reduce((acc, item) => {
    const groupName = item.group_id ? "Group Name" : "Ungrouped"; // TODO: Get actual group name
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(item);
    return acc;
  }, {} as Record<string, typeof equipment>);

  return (
    <ScrollArea className="h-[700px]">
      <div className="space-y-4 pr-4">
        <div className="flex items-center gap-2">
          {isAddingGroup ? (
            <div className="flex items-center gap-2 w-full">
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name"
                className="h-7"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={handleAddGroup}
              >
                Add
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={() => {
                  setIsAddingGroup(false);
                  setNewGroupName("");
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              onClick={() => setIsAddingGroup(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Group
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading equipment...</div>
        ) : equipment?.length === 0 ? (
          <div className="text-sm text-muted-foreground">No equipment added yet</div>
        ) : (
          Object.entries(groupedEquipment || {}).map(([groupName, items]) => (
            <ProjectEquipmentGroup
              key={groupName}
              name={groupName}
              equipment={items || []}
              onRemove={removeEquipment}
            />
          ))
        )}
      </div>
    </ScrollArea>
  );
}