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
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { formatPrice } from "@/utils/priceFormatters";

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
  const { equipment = [], loading, addEquipment, removeEquipment } = useProjectEquipment(projectId);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [pendingEquipment, setPendingEquipment] = useState<Equipment | null>(null);
  const queryClient = useQueryClient();

  // Add this query to fetch groups
  const { data: groups = [] } = useQuery({
    queryKey: ['project-equipment-groups', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_equipment_groups')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order');
      
      if (error) throw error;
      return data || [];
    }
  });

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

    try {
      await addEquipment(item, selectedGroupId);
      toast.success('Equipment added to group');
    } catch (error) {
      console.error('Error adding equipment:', error);
      toast.error('Failed to add equipment');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !pendingEquipment) return;

    try {
      console.log('Creating new group:', { projectId, name: newGroupName });
      
      // Calculate the next sort order
      const maxSortOrder = groups.reduce((max, group) => 
        Math.max(max, group.sort_order || 0), -1);
      const nextSortOrder = maxSortOrder + 1;

      // First create the group
      const { data: newGroup, error: groupError } = await supabase
        .from('project_equipment_groups')
        .insert({
          project_id: projectId,
          name: newGroupName,
          sort_order: nextSortOrder
        })
        .select()
        .single();

      if (groupError) throw groupError;

      if (!newGroup) {
        throw new Error('No group was created');
      }

      console.log('New group created:', newGroup);

      // Update the UI to show the new group
      await queryClient.invalidateQueries({ 
        queryKey: ['project-equipment-groups', projectId] 
      });

      // Set the new group as selected
      onGroupSelect(newGroup.id);

      // Add the pending equipment to the new group
      await addEquipment(pendingEquipment, newGroup.id);
      
      // Reset the dialog state
      setShowGroupDialog(false);
      setNewGroupName("");
      setPendingEquipment(null);
      
      toast.success('Group created and equipment added successfully');
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    }
  };

  // Calculate total price for a group
  const calculateGroupTotal = (groupEquipment: typeof equipment) => {
    return groupEquipment.reduce((total, item) => {
      return total + (item.rental_price || 0) * item.quantity;
    }, 0);
  };

  // Group equipment by their group_id
  const groupedEquipment = equipment.reduce((acc, item) => {
    const groupId = item.group_id || 'ungrouped';
    if (!acc[groupId]) {
      acc[groupId] = [];
    }
    acc[groupId].push(item);
    return acc;
  }, {} as Record<string, typeof equipment>);

  return (
    <>
      <div 
        className="h-full"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <ScrollArea className="h-full">
          <div className="p-4 space-y-6">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading equipment...</div>
            ) : equipment.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {selectedGroupId 
                  ? "No equipment in this group yet" 
                  : "Select or create a group to add equipment"}
              </div>
            ) : (
              groups.map((group) => {
                const groupEquipment = groupedEquipment[group.id] || [];
                if (selectedGroupId && selectedGroupId !== group.id) return null;
                
                return groupEquipment.length > 0 ? (
                  <div key={group.id} className="space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <div className="font-medium text-sm">
                        {group.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatPrice(calculateGroupTotal(groupEquipment))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {groupEquipment.map((item) => (
                        <ProjectEquipmentItem
                          key={item.id}
                          item={item}
                          onRemove={() => removeEquipment(item.id)}
                        />
                      ))}
                    </div>
                  </div>
                ) : null;
              })
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
