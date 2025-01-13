import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectEquipmentItem } from "./ProjectEquipmentItem";
import { useProjectEquipment } from "@/hooks/useProjectEquipment";
import { Equipment } from "@/types/equipment";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface ProjectBaseEquipmentListProps {
  projectId: string;
  selectedGroupId: string | null;
  onGroupSelect: (groupId: string) => void;
}

export function ProjectBaseEquipmentList({ 
  projectId, 
  selectedGroupId,
  onGroupSelect 
}: ProjectBaseEquipmentListProps) {
  const { equipment = [], loading, removeEquipment } = useProjectEquipment(projectId);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [pendingEquipment, setPendingEquipment] = useState<Equipment | null>(null);
  const queryClient = useQueryClient();

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    const item = JSON.parse(data) as Equipment;

    if (!selectedGroupId) {
      setPendingEquipment(item);
      setShowGroupDialog(true);
      return;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !pendingEquipment) return;

    try {
      // First create the group
      const { data: newGroup, error: groupError } = await supabase
        .from('project_equipment_groups')
        .insert({
          project_id: projectId,
          name: newGroupName,
          sort_order: 0
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Update the UI to show the new group
      await queryClient.invalidateQueries({ 
        queryKey: ['project-equipment-groups', projectId] 
      });

      // Set the new group as selected
      if (newGroup) {
        onGroupSelect(newGroup.id);
      }

      // Reset the dialog state
      setShowGroupDialog(false);
      setNewGroupName("");
      setPendingEquipment(null);
      
      toast.success('Group created successfully');
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    }
  };

  return (
    <>
      <div 
        className="h-full"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading equipment...</div>
            ) : equipment.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {selectedGroupId 
                  ? "No equipment in this group yet" 
                  : "Select or create a group to add equipment"}
              </div>
            ) : (
              equipment.map((item) => (
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

      {/* Create Group Dialog */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Equipment Group</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              You need to create a group before adding equipment to the project.
            </p>
            <Input
              placeholder="Enter group name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newGroupName.trim()) {
                  handleCreateGroup();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowGroupDialog(false);
                setNewGroupName("");
                setPendingEquipment(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim()}
            >
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}