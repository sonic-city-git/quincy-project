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
import { useState } from "react";
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
        for (const item of equipment?.filter(e => e.group_id === groupToDelete) || []) {
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

      await queryClient.invalidateQueries({ 
        queryKey: ['project-equipment-groups', projectId] 
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['project-equipment', projectId] 
      });
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  };

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

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !pendingEquipment) return;

    try {
      const { data: group, error: groupError } = await supabase
        .from('project_equipment_groups')
        .insert({
          project_id: projectId,
          name: newGroupName,
          sort_order: groups.length
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add the equipment to the new group
      if (pendingEquipment.type === 'project-equipment') {
        const { error: updateError } = await supabase
          .from('project_equipment')
          .update({ group_id: group.id })
          .eq('id', pendingEquipment.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('project_equipment')
          .insert({
            project_id: projectId,
            equipment_id: pendingEquipment.id,
            quantity: 1,
            group_id: group.id
          });

        if (insertError) throw insertError;
      }

      await queryClient.invalidateQueries({ 
        queryKey: ['project-equipment-groups', projectId] 
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['project-equipment', projectId] 
      });

      setNewGroupName("");
      setPendingEquipment(null);
      setShowNewGroupDialog(false);
      onGroupSelect(group.id);
      toast.success('Group created and equipment added successfully');
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
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

      if (item.type === 'project-equipment') {
        // Check if the equipment already exists in the target group
        const { data: existingEquipment, error: queryError } = await supabase
          .from('project_equipment')
          .select('*')
          .eq('project_id', projectId)
          .eq('equipment_id', item.equipment_id)
          .eq('group_id', groupId)
          .maybeSingle();

        if (queryError) throw queryError;

        if (existingEquipment) {
          // If it exists in target group, add quantities
          const { error: updateError } = await supabase
            .from('project_equipment')
            .update({ 
              quantity: (existingEquipment.quantity || 0) + (item.quantity || 1)
            })
            .eq('id', existingEquipment.id);

          if (updateError) throw updateError;

          // Delete the original equipment entry
          const { error: deleteError } = await supabase
            .from('project_equipment')
            .delete()
            .eq('id', item.id);

          if (deleteError) throw deleteError;
        } else {
          // If it doesn't exist in target group, just update the group_id
          const { error: updateError } = await supabase
            .from('project_equipment')
            .update({ group_id: groupId })
            .eq('id', item.id);

          if (updateError) throw updateError;
        }
      } else {
        // Adding new equipment from equipment list
        const { data: existingEquipment, error: queryError } = await supabase
          .from('project_equipment')
          .select('*')
          .eq('project_id', projectId)
          .eq('equipment_id', item.id)
          .eq('group_id', groupId)
          .maybeSingle();

        if (queryError) throw queryError;

        if (existingEquipment) {
          // If it exists, increment the quantity
          const { error: updateError } = await supabase
            .from('project_equipment')
            .update({ 
              quantity: (existingEquipment.quantity || 0) + 1 
            })
            .eq('id', existingEquipment.id);

          if (updateError) throw updateError;
        } else {
          // If it doesn't exist, create new entry
          const { error: insertError } = await supabase
            .from('project_equipment')
            .insert({
              project_id: projectId,
              equipment_id: item.id,
              quantity: 1,
              group_id: groupId
            });

          if (insertError) throw insertError;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['project-equipment', projectId] });
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

  return (
    <ScrollArea 
      className="h-full"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleColumnDrop}
    >
      <div className="space-y-6 pr-4">
        {groups.map(group => {
          const groupEquipment = equipment?.filter(item => item.group_id === group.id) || [];
          const isSelected = selectedGroupId === group.id;
          const groupTotal = calculateGroupTotal(groupEquipment);
          
          return (
            <div 
              key={group.id} 
              className={cn(
                "rounded-lg border-2 transition-all duration-200 relative overflow-hidden",
                isSelected 
                  ? "border-primary/20" 
                  : "border-zinc-800/50"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, group.id)}
            >
              <div className={cn(
                "absolute inset-0 transition-all duration-200",
                isSelected 
                  ? "bg-primary/5" 
                  : "bg-zinc-900/50"
              )} />
              <div className="relative z-20">
                <div className="bg-zinc-900/90">
                  <div className="flex items-center justify-between px-4 py-2">
                    <div 
                      className={cn(
                        "flex-1 cursor-pointer transition-colors text-white",
                        isSelected 
                          ? "hover:text-primary/90" 
                          : "hover:text-white/90"
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
                    <ProjectEquipmentItem
                      key={item.id}
                      item={item}
                      onRemove={() => removeEquipment(item.id)}
                    />
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
