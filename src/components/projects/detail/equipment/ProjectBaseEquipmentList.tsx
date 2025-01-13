import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectEquipmentItem } from "./ProjectEquipmentItem";
import { useProjectEquipment } from "@/hooks/useProjectEquipment";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/utils/priceFormatters";
import { X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface ProjectBaseEquipmentListProps {
  projectId: string;
  selectedGroupId: string | null;
  onGroupSelect: (groupId: string | null) => void;
}

export function ProjectBaseEquipmentList({ 
  projectId, 
  selectedGroupId,
  onGroupSelect,
}: ProjectBaseEquipmentListProps) {
  const { equipment, loading, removeEquipment } = useProjectEquipment(projectId);
  const queryClient = useQueryClient();
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [targetGroupId, setTargetGroupId] = useState<string>("");
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [pendingEquipment, setPendingEquipment] = useState<any>(null);
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Fetch groups
  const { data: groups = [] } = useQuery({
    queryKey: ['project-equipment-groups', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_equipment_groups')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order');

      if (error) throw error;
      return data;
    }
  });

  // Effect to scroll to newly added equipment
  useEffect(() => {
    if (lastAddedItemId && scrollAreaRef.current) {
      const element = document.getElementById(`equipment-${lastAddedItemId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setLastAddedItemId(null); // Reset after scrolling
      }
    }
  }, [lastAddedItemId, equipment]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    try {
      const { data: newGroup, error } = await supabase
        .from('project_equipment_groups')
        .insert({
          project_id: projectId,
          name: newGroupName.trim(),
          sort_order: groups.length
        })
        .select()
        .single();

      if (error) throw error;

      if (pendingEquipment) {
        if (pendingEquipment.type === 'project-equipment') {
          await supabase
            .from('project_equipment')
            .update({ group_id: newGroup.id })
            .eq('id', pendingEquipment.id);
        } else {
          await supabase
            .from('project_equipment')
            .insert({
              project_id: projectId,
              equipment_id: pendingEquipment.id,
              quantity: 1,
              group_id: newGroup.id
            });
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['project-equipment-groups', projectId] });
      await queryClient.invalidateQueries({ queryKey: ['project-equipment', projectId] });
      
      setShowNewGroupDialog(false);
      setNewGroupName("");
      setPendingEquipment(null);
      toast.success('Group created successfully');
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    // Find equipment in the group before deletion
    const groupEquipment = equipment?.filter(item => item.group_id === groupId) || [];
    
    if (groupEquipment.length > 0) {
      setGroupToDelete(groupId);
    } else {
      // If no equipment, delete the group directly
      await deleteGroup(groupId);
    }
  };

  const handleConfirmDelete = async () => {
    if (!groupToDelete) return;

    try {
      if (targetGroupId) {
        // Move equipment to target group
        const equipmentToMove = equipment?.filter(e => e.group_id === groupToDelete) || [];
        
        for (const item of equipmentToMove) {
          const { data: existingEquipment } = await supabase
            .from('project_equipment')
            .select('*')
            .eq('project_id', projectId)
            .eq('equipment_id', item.equipment_id)
            .eq('group_id', targetGroupId)
            .maybeSingle();

          if (existingEquipment) {
            // If equipment exists in target group, update quantity
            await supabase
              .from('project_equipment')
              .update({ 
                quantity: (existingEquipment.quantity || 0) + (item.quantity || 1)
              })
              .eq('id', existingEquipment.id);

            // Delete the original equipment entry
            await supabase
              .from('project_equipment')
              .delete()
              .eq('id', item.id);
          } else {
            // If it doesn't exist, just update the group_id
            await supabase
              .from('project_equipment')
              .update({ group_id: targetGroupId })
              .eq('id', item.id);
          }
        }
      } else {
        // Delete all equipment in the group
        await supabase
          .from('project_equipment')
          .delete()
          .eq('group_id', groupToDelete);
      }

      // Delete the group
      await deleteGroup(groupToDelete);
      
      // Reset state
      setGroupToDelete(null);
      setTargetGroupId("");
      
      if (selectedGroupId === groupToDelete) {
        onGroupSelect(null);
      }
      
      // Invalidate queries to refresh the data
      await queryClient.invalidateQueries({ 
        queryKey: ['project-equipment', projectId] 
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['project-equipment-groups', projectId] 
      });
      
      toast.success('Group deleted successfully');
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from('project_equipment_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  };

  const handleDrop = async (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('bg-primary/5', 'border-primary/20');

    try {
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      const item = JSON.parse(data);
      let newItemId: string | null = null;

      if (item.type === 'project-equipment') {
        const { data: existingEquipment } = await supabase
          .from('project_equipment')
          .select('*')
          .eq('project_id', projectId)
          .eq('equipment_id', item.equipment_id)
          .eq('group_id', groupId)
          .maybeSingle();

        if (existingEquipment) {
          const { data } = await supabase
            .from('project_equipment')
            .update({ 
              quantity: (existingEquipment.quantity || 0) + (item.quantity || 1)
            })
            .eq('id', existingEquipment.id)
            .select()
            .single();
          
          if (data) newItemId = data.id;
        } else {
          const { data } = await supabase
            .from('project_equipment')
            .update({ group_id: groupId })
            .eq('id', item.id)
            .select()
            .single();
          
          if (data) newItemId = data.id;
        }
      } else {
        const { data: existingEquipment } = await supabase
          .from('project_equipment')
          .select('*')
          .eq('project_id', projectId)
          .eq('equipment_id', item.id)
          .eq('group_id', groupId)
          .maybeSingle();

        if (existingEquipment) {
          const { data } = await supabase
            .from('project_equipment')
            .update({ 
              quantity: (existingEquipment.quantity || 0) + 1 
            })
            .eq('id', existingEquipment.id)
            .select()
            .single();
          
          if (data) newItemId = data.id;
        } else {
          const { data } = await supabase
            .from('project_equipment')
            .insert({
              project_id: projectId,
              equipment_id: item.id,
              quantity: 1,
              group_id: groupId
            })
            .select()
            .single();
          
          if (data) newItemId = data.id;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['project-equipment', projectId] });
      if (newItemId) setLastAddedItemId(newItemId);
      toast.success('Equipment moved successfully');
    } catch (error) {
      console.error('Error moving equipment:', error);
      toast.error('Failed to move equipment');
    }
  };

  const handleColumnDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      const item = JSON.parse(data);
      setPendingEquipment(item);
      setShowNewGroupDialog(true);
    } catch (error) {
      console.error('Error handling drop:', error);
      toast.error('Failed to process dropped item');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.classList.add('bg-primary/5', 'border-primary/20');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('bg-primary/5', 'border-primary/20');
  };

  const calculateGroupTotal = (groupEquipment: any[]) => {
    return groupEquipment.reduce((total, item) => {
      return total + (item.rental_price || 0) * item.quantity;
    }, 0);
  };

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">Loading equipment...</div>
    );
  }

  // Sort equipment alphabetically within each group
  const sortedEquipment = (groupId: string) => {
    return (equipment?.filter(item => item.group_id === groupId) || [])
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  return (
    <ScrollArea 
      ref={scrollAreaRef}
      className="h-full"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleColumnDrop}
    >
      <div className="space-y-6 pr-4">
        {groups.map(group => {
          const groupEquipment = sortedEquipment(group.id);
          const isSelected = selectedGroupId === group.id;
          const groupTotal = calculateGroupTotal(groupEquipment);
          
          return (
            <div 
              key={group.id} 
              className={cn(
                "rounded-lg border-2 transition-all duration-200 relative overflow-hidden",
                isSelected 
                  ? "border-primary bg-primary/5" 
                  : "border-zinc-800/50 hover:border-primary/20 hover:bg-primary/5"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, group.id)}
            >
              <div className={cn(
                "absolute inset-0 transition-all duration-200",
                isSelected 
                  ? "bg-primary/5" 
                  : "bg-zinc-900/50 group-hover:bg-primary/5"
              )} />
              <div className="relative z-20">
                <div className={cn(
                  "transition-colors",
                  isSelected ? "bg-primary/10" : "bg-zinc-900/90"
                )}>
                  <div className="flex items-center justify-between px-4 py-2">
                    <div 
                      className={cn(
                        "flex-1 cursor-pointer transition-colors",
                        isSelected 
                          ? "text-primary font-medium" 
                          : "text-white hover:text-primary/90"
                      )}
                      onClick={() => onGroupSelect(group.id === selectedGroupId ? null : group.id)}
                    >
                      <h3 className="text-sm font-medium">{group.name}</h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {formatPrice(groupTotal)}
                      </span>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="text-red-500 hover:text-red-400 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-3 space-y-2 relative z-30 bg-background/95">
                  {groupEquipment.map((item) => (
                    <div key={item.id} id={`equipment-${item.id}`}>
                      <ProjectEquipmentItem
                        item={item}
                        onRemove={() => removeEquipment(item.id)}
                      />
                    </div>
                  ))}
                  {groupEquipment.length === 0 && (
                    <div className="text-sm text-muted-foreground px-1">
                      No equipment in this group
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog 
        open={!!groupToDelete} 
        onOpenChange={() => {
          setGroupToDelete(null);
          setTargetGroupId("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              This group contains equipment. Would you like to move the equipment to another group or delete it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={targetGroupId} onValueChange={setTargetGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a target group (or leave empty to delete equipment)" />
              </SelectTrigger>
              <SelectContent>
                {groups
                  .filter(g => g.id !== groupToDelete)
                  .map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              {targetGroupId ? 'Move & Delete Group' : 'Delete All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog 
        open={showNewGroupDialog} 
        onOpenChange={(open) => {
          if (!open) {
            setShowNewGroupDialog(false);
            setNewGroupName("");
            setPendingEquipment(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create New Equipment Group</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a name for the new equipment group
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
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
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateGroup}>
              Create Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollArea>
  );
}