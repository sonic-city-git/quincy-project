import { useState } from "react";
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
import { X } from "lucide-react";

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
  const [draggedOverGroupId, setDraggedOverGroupId] = useState<string | null>(null);
  const queryClient = useQueryClient();

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

  const handleDrop = async (e: React.DragEvent, groupId?: string) => {
    e.preventDefault();
    setDraggedOverGroupId(null);
    
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    try {
      const item = JSON.parse(data);
      
      // If it's equipment being moved between groups
      if (item.type === 'project-equipment') {
        const equipmentId = item.id;
        const { error } = await supabase
          .from('project_equipment')
          .update({ group_id: groupId || null })
          .eq('id', equipmentId);

        if (error) throw error;
        
        await queryClient.invalidateQueries({ 
          queryKey: ['project-equipment', projectId] 
        });
        
        toast.success('Equipment moved successfully');
        return;
      }

      // If dropped on a specific group, add to that group
      if (groupId) {
        try {
          await addEquipment(item, groupId);
          toast.success('Equipment added to group');
        } catch (error) {
          console.error('Error adding equipment:', error);
          toast.error('Failed to add equipment');
        }
        return;
      }

      // If dropped in empty space, show group creation dialog
      setPendingEquipment(item);
      setShowGroupDialog(true);
    } catch (error) {
      console.error('Error handling drop:', error);
      toast.error('Failed to handle equipment drop');
    }
  };

  const handleDragOver = (e: React.DragEvent, groupId?: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (groupId) {
      setDraggedOverGroupId(groupId);
    }
  };

  const handleDragLeave = () => {
    setDraggedOverGroupId(null);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !pendingEquipment) return;

    try {
      const maxSortOrder = groups.reduce((max, group) => 
        Math.max(max, group.sort_order || 0), -1);
      const nextSortOrder = maxSortOrder + 1;

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

      await queryClient.invalidateQueries({ 
        queryKey: ['project-equipment-groups', projectId] 
      });

      onGroupSelect(newGroup.id);

      await addEquipment(pendingEquipment, newGroup.id);
      
      setShowGroupDialog(false);
      setNewGroupName("");
      setPendingEquipment(null);
      
      toast.success('Group created and equipment added successfully');
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const { error: equipmentError } = await supabase
        .from('project_equipment')
        .delete()
        .eq('group_id', groupId);

      if (equipmentError) throw equipmentError;

      const { error: groupError } = await supabase
        .from('project_equipment_groups')
        .delete()
        .eq('id', groupId);

      if (groupError) throw groupError;

      await queryClient.invalidateQueries({ 
        queryKey: ['project-equipment-groups', projectId] 
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['project-equipment', projectId] 
      });

      toast.success('Group deleted successfully');
    } catch (error: any) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
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

  // Calculate total price for a group
  const calculateGroupTotal = (groupEquipment: typeof equipment) => {
    return groupEquipment.reduce((total, item) => {
      return total + (item.rental_price || 0) * item.quantity;
    }, 0);
  };

  return (
    <>
      <div 
        className="h-full"
        onDrop={(e) => handleDrop(e)}
        onDragOver={(e) => handleDragOver(e)}
        onDragLeave={handleDragLeave}
      >
        <ScrollArea className="h-full">
          <div className="p-4 space-y-6">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading equipment...</div>
            ) : (
              groups.map((group) => {
                const groupEquipment = groupedEquipment[group.id] || [];
                
                return (
                  <div 
                    key={group.id} 
                    className={`rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden transition-colors ${
                      draggedOverGroupId === group.id ? 'border-blue-500 bg-blue-500/10' : ''
                    }`}
                    onDrop={(e) => handleDrop(e, group.id)}
                    onDragOver={(e) => handleDragOver(e, group.id)}
                    onDragLeave={handleDragLeave}
                  >
                    <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                      <div className="font-medium">
                        {group.name}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground">
                          {formatPrice(calculateGroupTotal(groupEquipment))}
                        </div>
                        <button
                          className="h-8 w-8 inline-flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md"
                          onClick={() => handleDeleteGroup(group.id)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      {groupEquipment.map((item) => (
                        <ProjectEquipmentItem
                          key={item.id}
                          item={item}
                          onRemove={() => removeEquipment(item.id)}
                        />
                      ))}
                      {groupEquipment.length === 0 && (
                        <div className="text-sm text-muted-foreground py-2">
                          Drop equipment here
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

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