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
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

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

  const handleDeleteGroup = async (groupId: string) => {
    const groupEquipment = equipment?.filter(item => item.group_id === groupId) || [];
    
    if (groupEquipment.length > 0) {
      setGroupToDelete(groupId);
    } else {
      await deleteGroupOnly(groupId);
    }
  };

  const deleteGroupOnly = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from('project_equipment_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      if (selectedGroupId === groupId) {
        onGroupSelect(null);
      }

      await queryClient.invalidateQueries({ 
        queryKey: ['project-equipment-groups', projectId] 
      });

      toast.success('Group deleted successfully');
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };

  const handleConfirmDelete = async () => {
    if (!groupToDelete) return;

    try {
      if (targetGroupId) {
        // Get equipment from source group
        const sourceEquipment = equipment?.filter(item => item.group_id === groupToDelete) || [];
        
        // For each piece of equipment in source group
        for (const item of sourceEquipment) {
          // Check if equipment exists in target group
          const { data: existingEquipment } = await supabase
            .from('project_equipment')
            .select('*')
            .eq('project_id', projectId)
            .eq('equipment_id', item.equipment_id)
            .eq('group_id', targetGroupId)
            .maybeSingle();

          if (existingEquipment) {
            // If exists, update quantity
            const { error: updateError } = await supabase
              .from('project_equipment')
              .update({ 
                quantity: existingEquipment.quantity + item.quantity 
              })
              .eq('id', existingEquipment.id);

            if (updateError) throw updateError;

            // Delete the source equipment
            const { error: deleteError } = await supabase
              .from('project_equipment')
              .delete()
              .eq('id', item.id);

            if (deleteError) throw deleteError;
          } else {
            // If doesn't exist, just update group_id
            const { error: moveError } = await supabase
              .from('project_equipment')
              .update({ group_id: targetGroupId })
              .eq('id', item.id);

            if (moveError) throw moveError;
          }
        }
      } else {
        // Delete all equipment in the group
        const { error: deleteError } = await supabase
          .from('project_equipment')
          .delete()
          .eq('group_id', groupToDelete);

        if (deleteError) throw deleteError;
      }

      await deleteGroupOnly(groupToDelete);
      setGroupToDelete(null);
      setTargetGroupId("");

      await queryClient.invalidateQueries({ 
        queryKey: ['project-equipment', projectId] 
      });

      toast.success(targetGroupId ? 'Equipment moved and group deleted' : 'Group and equipment deleted');

    } catch (error) {
      console.error('Error handling group deletion:', error);
      toast.error('Failed to process group deletion');
    }
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
    <ScrollArea className="h-full">
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
    </ScrollArea>
  );
}